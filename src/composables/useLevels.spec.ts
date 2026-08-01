import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLevels, STORAGE_KEY, LAST_SYNC_KEY, bestRunRange } from './useLevels'
import { refreshRanks as mockRefreshRanks } from '../services/rankSync'
import type { Level } from '../types'

vi.mock('../services/rankSync', () => ({
  refreshRanks: vi.fn(),
}))

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'id',
    rank: 1,
    name: 'Level',
    status: 'completed',
    aredlRank: null,
    dlRank: null,
    bestRunMin: null,
    bestRunMax: null,
    attempts: null,
    attemptsNote: '',
    date: null,
    dateNote: '',
    enjoyment: null,
    creator: '',
    videoUrl: '',
    levelId: '',
    notes: '',
    ...overrides,
  }
}

const sampleLevels: Level[] = [
  makeLevel({ id: 'a', rank: 1, name: 'Gravity', aredlRank: 801, attempts: 4213, date: '2026-03-31', creator: 'Xstep' }),
  makeLevel({ id: 'b', rank: 2, name: 'Bloodbath', aredlRank: 802, attempts: 16000, date: '2022-02-02' }),
  makeLevel({ id: 'c', rank: 3, name: 'Idols', aredlRank: 548, attempts: 5786, date: '2025-06-15' }),
  makeLevel({ id: 'd', rank: 4, name: 'Prismatic Haze', aredlRank: null, attempts: null, date: null }),
]

describe('useLevels — initial state', () => {
  beforeEach(() => localStorage.clear())

  it('starts with an empty list when storage is empty', () => {
    const { levels } = useLevels()
    expect(levels.value).toEqual([])
  })

  it('loads existing storage data instead of an empty list when storage is non-empty', () => {
    const custom: Level[] = [makeLevel({ id: 'x', name: 'Custom' })]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
    const { levels } = useLevels()
    expect(levels.value).toEqual(custom)
  })
})

describe('useLevels — CRUD', () => {
  beforeEach(() => localStorage.clear())

  it('addLevel appends a level with the next sequential rank and a generated id', () => {
    const { levels, addLevel } = useLevels()
    addLevel({ name: 'New Level', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(1)
    const added = levels.value[0]
    expect(added.name).toBe('New Level')
    expect(added.rank).toBe(1)
    expect(added.id).toBeTruthy()
  })

  it('updateLevel patches only the given fields on the matching id', () => {
    const { levels, addLevel, updateLevel } = useLevels()
    addLevel({ name: 'Target', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    const target = levels.value[0]
    updateLevel(target.id, { enjoyment: 10 })
    expect(levels.value[0].enjoyment).toBe(10)
    expect(levels.value[0].name).toBe(target.name)
  })

  it('deleteLevel removes the matching id and leaves the rest untouched', () => {
    const { levels, addLevel, deleteLevel } = useLevels()
    addLevel({ name: 'Keep', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    addLevel({ name: 'Remove', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    const target = levels.value[1]
    deleteLevel(target.id)
    expect(levels.value).toHaveLength(1)
    expect(levels.value.find((l) => l.id === target.id)).toBeUndefined()
  })

  it('clearAllData removes every level', () => {
    const { levels, addLevel, clearAllData } = useLevels()
    addLevel({ name: 'Temp', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(1)
    clearAllData()
    expect(levels.value).toEqual([])
  })
})

describe('useLevels — persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  it('debounces writes to localStorage after a mutation', () => {
    const { addLevel } = useLevels()
    addLevel({ name: 'Persisted Level', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    vi.advanceTimersByTime(500)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Persisted Level')
    vi.useRealTimers()
  })
})

describe('useLevels — sorting', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to sorting by AREDL rank ascending', () => {
    const { importJson, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    const aredlRanks = visibleLevels.value.filter((l) => l.aredlRank !== null).map((l) => l.aredlRank!)
    expect(aredlRanks).toEqual([...aredlRanks].sort((a, b) => a - b))
  })

  it('setSort on a new key sorts ascending by that key', () => {
    const { importJson, setSort, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    setSort('attempts')
    const nonNull = visibleLevels.value.filter((l) => l.attempts !== null).map((l) => l.attempts!)
    expect(nonNull).toEqual([...nonNull].sort((a, b) => a - b))
  })

  it('setSort on the same key twice flips to descending', () => {
    const { importJson, setSort, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    setSort('attempts')
    setSort('attempts')
    const nonNull = visibleLevels.value.filter((l) => l.attempts !== null).map((l) => l.attempts!)
    expect(nonNull).toEqual([...nonNull].sort((a, b) => b - a))
  })

  it('sorts null values last regardless of direction', () => {
    const { importJson, setSort, sortDir, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    setSort('attempts')
    expect(visibleLevels.value[visibleLevels.value.length - 1].attempts).toBeNull()
    setSort('attempts')
    expect(sortDir.value).toBe('desc')
    expect(visibleLevels.value[visibleLevels.value.length - 1].attempts).toBeNull()
  })
})

describe('useLevels — status sections', () => {
  beforeEach(() => localStorage.clear())

  const mixedStatusLevels: Level[] = [
    makeLevel({ id: 'a', name: 'Done', status: 'completed' }),
    makeLevel({ id: 'b', name: 'Doing', status: 'in_progress' }),
    makeLevel({ id: 'c', name: 'Wishlist', status: 'planned' }),
  ]

  it('visibleLevels includes all statuses by default', () => {
    const { importJson, visibleLevels } = useLevels()
    importJson(JSON.stringify(mixedStatusLevels))
    expect(visibleLevels.value.map((l) => l.name).sort()).toEqual(['Doing', 'Done', 'Wishlist'])
  })

  it('toggling off a status filter hides its levels from visibleLevels', () => {
    const { importJson, filters, visibleLevels } = useLevels()
    importJson(JSON.stringify(mixedStatusLevels))
    filters.statuses.in_progress = false
    filters.statuses.planned = false
    expect(visibleLevels.value.map((l) => l.name)).toEqual(['Done'])
  })

  it('can show only in_progress levels', () => {
    const { importJson, filters, visibleLevels } = useLevels()
    importJson(JSON.stringify(mixedStatusLevels))
    filters.statuses.completed = false
    filters.statuses.planned = false
    expect(visibleLevels.value.map((l) => l.name)).toEqual(['Doing'])
  })

  it('treats levels with a missing status as completed for backward compatibility', () => {
    const { levels, visibleLevels } = useLevels()
    levels.value = [{ ...makeLevel({ id: 'legacy', name: 'Legacy Entry' }), status: undefined as unknown as Level['status'] }]
    expect(visibleLevels.value.map((l) => l.name)).toEqual(['Legacy Entry'])
  })
})

describe('useLevels — filtering', () => {
  beforeEach(() => localStorage.clear())

  it('search matches name case-insensitively', () => {
    const { importJson, filters, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    filters.search = 'gravity'
    expect(visibleLevels.value.map((l) => l.name)).toEqual(['Gravity'])
  })

  it('search matches creator case-insensitively', () => {
    const { importJson, filters, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    filters.search = 'xstep'
    expect(visibleLevels.value).toHaveLength(1)
    expect(visibleLevels.value[0].name).toBe('Gravity')
  })

  it('filters by attempts range, excluding entries with null attempts', () => {
    const { importJson, filters, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    filters.attemptsMin = 5000
    filters.attemptsMax = 9000
    for (const level of visibleLevels.value) {
      expect(level.attempts).not.toBeNull()
      expect(level.attempts!).toBeGreaterThanOrEqual(5000)
      expect(level.attempts!).toBeLessThanOrEqual(9000)
    }
  })

  it('filters by date range, excluding entries with null date', () => {
    const { importJson, filters, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    filters.dateFrom = '2026-01-01'
    filters.dateTo = '2026-12-31'
    for (const level of visibleLevels.value) {
      expect(level.date).not.toBeNull()
      expect(level.date! >= '2026-01-01' && level.date! <= '2026-12-31').toBe(true)
    }
  })

  it('combines search, range filters, and sort together', () => {
    const { importJson, filters, setSort, visibleLevels } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    filters.attemptsMin = 1000
    setSort('attempts')
    const attempts = visibleLevels.value.map((l) => l.attempts!)
    expect(attempts.every((a) => a >= 1000)).toBe(true)
    expect(attempts).toEqual([...attempts].sort((a, b) => a - b))
  })
})

describe('useLevels — import/export/clear', () => {
  beforeEach(() => localStorage.clear())

  it('exportJson serializes the current levels as valid JSON', () => {
    const { importJson, levels, exportJson } = useLevels()
    importJson(JSON.stringify(sampleLevels))
    const parsed = JSON.parse(exportJson())
    expect(parsed).toEqual(levels.value)
  })

  it('importJson accepts a well-formed Level[] and replaces the dataset', () => {
    const { levels, importJson } = useLevels()
    const replacement = [makeLevel({ id: 'a', name: 'Imported' })]
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

  it('clearAllData empties the list after mutation', () => {
    const { levels, addLevel, clearAllData } = useLevels()
    addLevel({ name: 'Temp', status: 'completed', aredlRank: null, dlRank: null, bestRunMin: null, bestRunMax: null, attempts: null, attemptsNote: '', date: null, dateNote: '', enjoyment: null, creator: '', videoUrl: '', levelId: '', notes: '' })
    expect(levels.value).toHaveLength(1)
    clearAllData()
    expect(levels.value).toEqual([])
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

describe('bestRunRange', () => {
  it('always returns 0-100 for completed levels regardless of stored values', () => {
    const level = makeLevel({ status: 'completed', bestRunMin: 12, bestRunMax: 34 })
    expect(bestRunRange(level)).toEqual({ min: 0, max: 100 })
  })

  it('defaults to 0-0 for non-completed levels with no best run set', () => {
    const level = makeLevel({ status: 'in_progress', bestRunMin: null, bestRunMax: null })
    expect(bestRunRange(level)).toEqual({ min: 0, max: 0 })
  })

  it('defaults missing (undefined) fields to 0, not "undefined"', () => {
    const { bestRunMin: _min, bestRunMax: _max, ...rest } = makeLevel({ status: 'planned' })
    const legacyLevel = rest as Level
    expect(bestRunRange(legacyLevel)).toEqual({ min: 0, max: 0 })
  })

  it('returns the stored range for in-progress/planned levels', () => {
    const level = makeLevel({ status: 'in_progress', bestRunMin: 20, bestRunMax: 60 })
    expect(bestRunRange(level)).toEqual({ min: 20, max: 60 })
  })
})
