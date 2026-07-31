import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLevels, STORAGE_KEY, LAST_SYNC_KEY } from './useLevels'
import { seedLevels } from '../data/seedLevels'
import { refreshRanks as mockRefreshRanks } from '../services/rankSync'

vi.mock('../services/rankSync', () => ({
  refreshRanks: vi.fn(),
}))

describe('useLevels — seed loading', () => {
  beforeEach(() => localStorage.clear())

  it('loads the 35-entry seed dataset when storage is empty', () => {
    const { levels } = useLevels()
    expect(levels.value).toHaveLength(35)
    expect(levels.value[0].name).toBe('Auditory Breaker')
  })

  it('loads existing storage data instead of the seed when storage is non-empty', () => {
    const custom: typeof seedLevels = [
      { id: 'x', rank: 1, name: 'Custom', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
    const { levels } = useLevels()
    expect(levels.value).toEqual(custom)
  })
})

describe('useLevels — CRUD', () => {
  beforeEach(() => localStorage.clear())

  it('addLevel appends a level with the next sequential rank and a generated id', () => {
    const { levels, addLevel } = useLevels()
    const before = levels.value.length
    addLevel({ name: 'New Level', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(before + 1)
    const added = levels.value[levels.value.length - 1]
    expect(added.name).toBe('New Level')
    expect(added.rank).toBe(before + 1)
    expect(added.id).toBeTruthy()
  })

  it('updateLevel patches only the given fields on the matching id', () => {
    const { levels, updateLevel } = useLevels()
    const target = levels.value[0]
    updateLevel(target.id, { enjoyment: 10 })
    expect(levels.value[0].enjoyment).toBe(10)
    expect(levels.value[0].name).toBe(target.name)
  })

  it('deleteLevel removes the matching id and leaves the rest untouched', () => {
    const { levels, deleteLevel } = useLevels()
    const before = levels.value.length
    const target = levels.value[0]
    deleteLevel(target.id)
    expect(levels.value).toHaveLength(before - 1)
    expect(levels.value.find((l) => l.id === target.id)).toBeUndefined()
  })
})

describe('useLevels — persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('debounces writes to localStorage after a mutation', () => {
    const { addLevel } = useLevels()
    addLevel({ name: 'Persisted Level', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    vi.advanceTimersByTime(500)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(36)
    expect(stored[35].name).toBe('Persisted Level')
    vi.useRealTimers()
  })
})

describe('useLevels — sorting', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to sorting by AREDL rank ascending', () => {
    const { visibleLevels } = useLevels()
    const aredlRanks = visibleLevels.value.filter((l) => l.aredlRank !== null).map((l) => l.aredlRank!)
    expect(aredlRanks).toEqual([...aredlRanks].sort((a, b) => a - b))
  })

  it('setSort on a new key sorts ascending by that key', () => {
    const { setSort, visibleLevels } = useLevels()
    setSort('attempts')
    const nonNull = visibleLevels.value.filter((l) => l.attempts !== null).map((l) => l.attempts!)
    expect(nonNull).toEqual([...nonNull].sort((a, b) => a - b))
  })

  it('setSort on the same key twice flips to descending', () => {
    const { setSort, visibleLevels } = useLevels()
    setSort('attempts')
    setSort('attempts')
    const nonNull = visibleLevels.value.filter((l) => l.attempts !== null).map((l) => l.attempts!)
    expect(nonNull).toEqual([...nonNull].sort((a, b) => b - a))
  })

  it('sorts null values last regardless of direction', () => {
    const { setSort, sortDir, visibleLevels } = useLevels()
    setSort('attempts')
    expect(visibleLevels.value[visibleLevels.value.length - 1].attempts).toBeNull()
    setSort('attempts')
    expect(sortDir.value).toBe('desc')
    expect(visibleLevels.value[visibleLevels.value.length - 1].attempts).toBeNull()
  })
})

describe('useLevels — filtering', () => {
  beforeEach(() => localStorage.clear())

  it('search matches name case-insensitively', () => {
    const { filters, visibleLevels } = useLevels()
    filters.search = 'gravity'
    expect(visibleLevels.value.map((l) => l.name)).toEqual(['Gravity'])
  })

  it('search matches creator case-insensitively', () => {
    const { levels, filters, visibleLevels } = useLevels()
    levels.value[0].creator = 'SomeCreator'
    filters.search = 'somecreator'
    expect(visibleLevels.value).toHaveLength(1)
    expect(visibleLevels.value[0].id).toBe(levels.value[0].id)
  })

  it('filters by attempts range, excluding entries with null attempts', () => {
    const { filters, visibleLevels } = useLevels()
    filters.attemptsMin = 5000
    filters.attemptsMax = 9000
    for (const level of visibleLevels.value) {
      expect(level.attempts).not.toBeNull()
      expect(level.attempts!).toBeGreaterThanOrEqual(5000)
      expect(level.attempts!).toBeLessThanOrEqual(9000)
    }
  })

  it('filters by date range, excluding entries with null date', () => {
    const { filters, visibleLevels } = useLevels()
    filters.dateFrom = '2026-01-01'
    filters.dateTo = '2026-12-31'
    for (const level of visibleLevels.value) {
      expect(level.date).not.toBeNull()
      expect(level.date! >= '2026-01-01' && level.date! <= '2026-12-31').toBe(true)
    }
  })

  it('combines search, range filters, and sort together', () => {
    const { filters, setSort, visibleLevels } = useLevels()
    filters.attemptsMin = 1000
    setSort('attempts')
    const attempts = visibleLevels.value.map((l) => l.attempts!)
    expect(attempts.every((a) => a >= 1000)).toBe(true)
    expect(attempts).toEqual([...attempts].sort((a, b) => a - b))
  })
})

describe('useLevels — import/export/reset', () => {
  beforeEach(() => localStorage.clear())

  it('exportJson serializes the current levels as valid JSON', () => {
    const { levels, exportJson } = useLevels()
    const parsed = JSON.parse(exportJson())
    expect(parsed).toEqual(levels.value)
  })

  it('importJson accepts a well-formed Level[] and replaces the dataset', () => {
    const { levels, importJson } = useLevels()
    const replacement = [
      { id: 'a', rank: 1, name: 'Imported', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' },
    ]
    const result = importJson(JSON.stringify(replacement))
    expect(result.ok).toBe(true)
    expect(levels.value).toEqual(replacement)
  })

  it('importJson rejects non-JSON input and leaves existing data untouched', () => {
    const { levels, importJson } = useLevels()
    const before = [...levels.value]
    const result = importJson('not json')
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
    expect(levels.value).toEqual(before)
  })

  it('importJson rejects a JSON object that is not an array', () => {
    const { levels, importJson } = useLevels()
    const before = [...levels.value]
    const result = importJson(JSON.stringify({ not: 'an array' }))
    expect(result.ok).toBe(false)
    expect(levels.value).toEqual(before)
  })

  it('importJson rejects entries missing required fields', () => {
    const { levels, importJson } = useLevels()
    const before = [...levels.value]
    const result = importJson(JSON.stringify([{ id: 'a', rank: 1 }]))
    expect(result.ok).toBe(false)
    expect(result.error).toContain('name')
    expect(levels.value).toEqual(before)
  })

  it('resetToSeed restores the original 35-entry seed dataset after mutation', () => {
    const { levels, addLevel, resetToSeed } = useLevels()
    addLevel({ name: 'Temp', aredlRank: null, dlRank: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(36)
    resetToSeed()
    expect(levels.value).toHaveLength(35)
    expect(levels.value[0].name).toBe('Auditory Breaker')
  })
})

describe('useLevels — rank sync', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(mockRefreshRanks).mockReset()
  })

  it('starts with lastSyncedAt null when no prior sync is stored', () => {
    const { lastSyncedAt, syncStatus } = useLevels()
    expect(lastSyncedAt.value).toBeNull()
    expect(syncStatus.value).toBe('idle')
  })

  it('loads a previously stored lastSyncedAt timestamp', () => {
    localStorage.setItem(LAST_SYNC_KEY, '2026-07-01T00:00:00.000Z')
    const { lastSyncedAt } = useLevels()
    expect(lastSyncedAt.value).toBe('2026-07-01T00:00:00.000Z')
  })

  it('refreshRanks updates and persists lastSyncedAt on success', async () => {
    vi.mocked(mockRefreshRanks).mockResolvedValue({ aredlOk: true, dlOk: true, matchedCount: 2, error: null })
    const { refreshRanks, lastSyncedAt, syncStatus } = useLevels()

    await refreshRanks()

    expect(syncStatus.value).toBe('idle')
    expect(lastSyncedAt.value).not.toBeNull()
    expect(localStorage.getItem(LAST_SYNC_KEY)).toBe(lastSyncedAt.value)
  })

  it('sets syncStatus to error and leaves lastSyncedAt untouched when the sync fails', async () => {
    vi.mocked(mockRefreshRanks).mockResolvedValue({ aredlOk: false, dlOk: true, matchedCount: 0, error: 'AREDL: boom' })
    const { refreshRanks, lastSyncedAt, syncStatus, syncError } = useLevels()

    await refreshRanks()

    expect(syncStatus.value).toBe('error')
    expect(syncError.value).toBe('AREDL: boom')
    expect(lastSyncedAt.value).toBeNull()
    expect(localStorage.getItem(LAST_SYNC_KEY)).toBeNull()
  })
})
