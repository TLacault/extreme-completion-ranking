import { ref, watch, computed, type Ref } from 'vue'
import type { Level } from '../types'
import { seedLevels } from '../data/seedLevels'

export const STORAGE_KEY = 'ecr:levels:v1'

export type SortKey = 'rank' | 'aredlRank' | 'dlRank' | 'attempts' | 'date' | 'enjoyment' | 'name'
export type SortDir = 'asc' | 'desc'

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

  const visibleLevels = computed(() => [...levels.value].sort(compareLevels))

  return { levels, addLevel, updateLevel, deleteLevel, reorderLevels, sortKey, sortDir, setSort, visibleLevels }
}
