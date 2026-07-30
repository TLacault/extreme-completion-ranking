import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLevels, STORAGE_KEY } from './useLevels'
import { seedLevels } from '../data/seedLevels'

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

  it('reorderLevels reassigns rank 1..N to match the given id order', () => {
    const { levels, reorderLevels } = useLevels()
    const ids = levels.value.map((l) => l.id)
    const reversed = [...ids].reverse()
    reorderLevels(reversed)
    for (let i = 0; i < reversed.length; i++) {
      const level = levels.value.find((l) => l.id === reversed[i])!
      expect(level.rank).toBe(i + 1)
    }
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
