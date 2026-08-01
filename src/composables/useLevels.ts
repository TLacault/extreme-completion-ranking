import { ref, watch, computed, reactive, type Ref } from 'vue'
import type { Level, LevelStatus } from '../types'
import { refreshRanks as syncRanks } from '../services/rankSync'

export const STORAGE_KEY = 'ecr:levels:v1'
export const LAST_SYNC_KEY = 'ecr:lastSync:v1'
export const COLUMNS_KEY = 'ecr:columns:v1'

export type SyncStatus = 'idle' | 'syncing' | 'error'

export type SortKey = 'aredlRank' | 'dlRank' | 'attempts' | 'date' | 'enjoyment' | 'name'
export type SortDir = 'asc' | 'desc'

export type ColumnKey = 'status' | 'aredlRank' | 'dlRank' | 'attempts' | 'date' | 'enjoyment' | 'bestRun' | 'video'
export type ColumnVisibility = Record<ColumnKey, boolean>

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  status: true,
  aredlRank: true,
  dlRank: true,
  attempts: true,
  date: true,
  enjoyment: true,
  bestRun: true,
  video: true,
}

export interface Filters {
  search: string
  attemptsMin: number | null
  attemptsMax: number | null
  enjoymentMin: number | null
  enjoymentMax: number | null
  dateFrom: string | null
  dateTo: string | null
  statuses: Record<LevelStatus, boolean>
}

function inRange(value: number | null, min: number | null, max: number | null): boolean {
  if (min === null && max === null) return true
  if (value === null) return false
  if (min !== null && value < min) return false
  if (max !== null && value > max) return false
  return true
}

export interface ImportResult {
  ok: boolean
  error?: string
}

const LEVEL_FIELD_TYPES: Record<keyof Level, 'string' | 'number' | 'nullable-string' | 'nullable-number'> = {
  id: 'string',
  rank: 'number',
  name: 'string',
  status: 'string',
  aredlRank: 'nullable-number',
  dlRank: 'nullable-number',
  bestRunMin: 'nullable-number',
  bestRunMax: 'nullable-number',
  attempts: 'nullable-number',
  attemptsNote: 'string',
  date: 'nullable-string',
  dateNote: 'string',
  enjoyment: 'nullable-number',
  creator: 'string',
  videoUrl: 'string',
  levelId: 'string',
  notes: 'string',
}

function validateLevel(item: unknown, index: number): string | null {
  if (typeof item !== 'object' || item === null) return `Entry ${index}: not an object.`
  const record = item as Record<string, unknown>
  for (const [field, kind] of Object.entries(LEVEL_FIELD_TYPES) as [keyof Level, string][]) {
    const value = record[field]
    const ok =
      (kind === 'string' && typeof value === 'string') ||
      (kind === 'number' && typeof value === 'number') ||
      (kind === 'nullable-string' && (value === null || typeof value === 'string')) ||
      (kind === 'nullable-number' && (value === null || typeof value === 'number'))
    if (!ok) return `Entry ${index}: missing or invalid field "${field}".`
  }
  return null
}

export function levelStatus(level: Level): LevelStatus {
  return level.status ?? 'completed'
}

export function bestRunRange(level: Level): { min: number; max: number } {
  if (levelStatus(level) === 'completed') return { min: 0, max: 100 }
  return { min: level.bestRunMin ?? 0, max: level.bestRunMax ?? 0 }
}

function generateId(): string {
  return `lvl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function debounce<T extends (...args: never[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}

function loadInitialLevels(): Level[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Level[]
  } catch {
    // fall through to an empty list on corrupt storage
  }
  return []
}

function loadInitialColumnVisibility(): ColumnVisibility {
  const raw = localStorage.getItem(COLUMNS_KEY)
  if (!raw) return { ...DEFAULT_COLUMN_VISIBILITY }
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed }
    }
  } catch {
    // fall through to defaults on corrupt storage
  }
  return { ...DEFAULT_COLUMN_VISIBILITY }
}

export function useLevels() {
  const levels: Ref<Level[]> = ref(loadInitialLevels())

  const persist = debounce((data: Level[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, 300)

  watch(levels, (data) => persist(data), { deep: true, flush: 'sync' })

  function addLevel(input: Omit<Level, 'id' | 'rank'>): void {
    const rank = levels.value.length + 1
    levels.value.push({ ...input, id: generateId(), rank })
  }

  function updateLevel(id: string, patch: Partial<Omit<Level, 'id'>>): void {
    const level = levels.value.find((l) => l.id === id)
    if (!level) return
    Object.assign(level, patch)
  }

  function deleteLevel(id: string): void {
    levels.value = levels.value.filter((l) => l.id !== id)
  }

  const sortKey = ref<SortKey>('aredlRank')
  const sortDir = ref<SortDir>('asc')

  function setSort(key: SortKey): void {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  function compareLevels(a: Level, b: Level): number {
    const key = sortKey.value
    const av = key === 'name' ? a.name : a[key]
    const bv = key === 'name' ? b.name : b[key]
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDir.value === 'asc' ? cmp : -cmp
  }

  const filters = reactive<Filters>({
    search: '',
    attemptsMin: null,
    attemptsMax: null,
    enjoymentMin: null,
    enjoymentMax: null,
    dateFrom: null,
    dateTo: null,
    statuses: { completed: true, in_progress: true, planned: true },
  })

  function matchesFilters(level: Level): boolean {
    if (!filters.statuses[levelStatus(level)]) return false
    const search = filters.search.trim().toLowerCase()
    if (search && !level.name.toLowerCase().includes(search) && !level.creator.toLowerCase().includes(search)) {
      return false
    }
    if (!inRange(level.attempts, filters.attemptsMin, filters.attemptsMax)) return false
    if (!inRange(level.enjoyment, filters.enjoymentMin, filters.enjoymentMax)) return false
    if (filters.dateFrom !== null || filters.dateTo !== null) {
      if (level.date === null) return false
      if (filters.dateFrom !== null && level.date < filters.dateFrom) return false
      if (filters.dateTo !== null && level.date > filters.dateTo) return false
    }
    return true
  }

  const visibleLevels = computed(() => levels.value.filter(matchesFilters).sort(compareLevels))

  const columnVisibility = reactive<ColumnVisibility>(loadInitialColumnVisibility())

  watch(
    columnVisibility,
    (data) => localStorage.setItem(COLUMNS_KEY, JSON.stringify(data)),
    { deep: true },
  )

  function exportJson(): string {
    return JSON.stringify(levels.value, null, 2)
  }

  function importJson(jsonText: string): ImportResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return { ok: false, error: 'Invalid JSON: the file could not be parsed.' }
    }
    if (!Array.isArray(parsed)) {
      return { ok: false, error: 'Expected a JSON array of levels.' }
    }
    for (let i = 0; i < parsed.length; i++) {
      const error = validateLevel(parsed[i], i)
      if (error) return { ok: false, error }
    }
    levels.value = parsed as Level[]
    return { ok: true }
  }

  function clearAllData(): void {
    levels.value = []
  }

  const lastSyncedAt = ref<string | null>(localStorage.getItem(LAST_SYNC_KEY))
  const syncStatus = ref<SyncStatus>('idle')
  const syncError = ref<string | null>(null)

  async function refreshRanks(): Promise<void> {
    syncStatus.value = 'syncing'
    syncError.value = null
    const result = await syncRanks(levels.value, updateLevel)
    if (result.error) {
      syncStatus.value = 'error'
      syncError.value = result.error
      return
    }
    syncStatus.value = 'idle'
    lastSyncedAt.value = new Date().toISOString()
    localStorage.setItem(LAST_SYNC_KEY, lastSyncedAt.value)
  }

  return {
    levels,
    addLevel,
    updateLevel,
    deleteLevel,
    sortKey,
    sortDir,
    setSort,
    filters,
    visibleLevels,
    columnVisibility,
    exportJson,
    importJson,
    clearAllData,
    lastSyncedAt,
    syncStatus,
    syncError,
    refreshRanks,
  }
}
