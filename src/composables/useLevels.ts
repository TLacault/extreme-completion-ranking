import { ref, watch, computed, reactive, type Ref } from 'vue'
import type { Level } from '../types'
import { seedLevels } from '../data/seedLevels'
import { refreshRanks as syncRanks } from '../services/rankSync'

export const STORAGE_KEY = 'ecr:levels:v1'
export const LAST_SYNC_KEY = 'ecr:lastSync:v1'

export type SyncStatus = 'idle' | 'syncing' | 'error'

export type SortKey = 'rank' | 'aredlRank' | 'dlRank' | 'attempts' | 'date' | 'enjoyment' | 'name'
export type SortDir = 'asc' | 'desc'

export interface Filters {
  search: string
  attemptsMin: number | null
  attemptsMax: number | null
  enjoymentMin: number | null
  enjoymentMax: number | null
  rankMin: number | null
  rankMax: number | null
  dateFrom: string | null
  dateTo: string | null
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
  aredlRank: 'nullable-number',
  dlRank: 'nullable-number',
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
  if (!raw) return structuredClone(seedLevels)
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as Level[]
  } catch {
    // fall through to seed data on corrupt storage
  }
  return structuredClone(seedLevels)
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

  function reorderLevels(idsInOrder: string[]): void {
    idsInOrder.forEach((id, index) => {
      const level = levels.value.find((l) => l.id === id)
      if (level) level.rank = index + 1
    })
  }

  const sortKey = ref<SortKey>('rank')
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
    rankMin: null,
    rankMax: null,
    dateFrom: null,
    dateTo: null,
  })

  function matchesFilters(level: Level): boolean {
    const search = filters.search.trim().toLowerCase()
    if (search && !level.name.toLowerCase().includes(search) && !level.creator.toLowerCase().includes(search)) {
      return false
    }
    if (!inRange(level.attempts, filters.attemptsMin, filters.attemptsMax)) return false
    if (!inRange(level.enjoyment, filters.enjoymentMin, filters.enjoymentMax)) return false
    if (!inRange(level.rank, filters.rankMin, filters.rankMax)) return false
    if (filters.dateFrom !== null || filters.dateTo !== null) {
      if (level.date === null) return false
      if (filters.dateFrom !== null && level.date < filters.dateFrom) return false
      if (filters.dateTo !== null && level.date > filters.dateTo) return false
    }
    return true
  }

  const visibleLevels = computed(() => levels.value.filter(matchesFilters).sort(compareLevels))

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

  function resetToSeed(): void {
    levels.value = structuredClone(seedLevels)
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
    reorderLevels,
    sortKey,
    sortDir,
    setSort,
    filters,
    visibleLevels,
    exportJson,
    importJson,
    resetToSeed,
    lastSyncedAt,
    syncStatus,
    syncError,
    refreshRanks,
  }
}
