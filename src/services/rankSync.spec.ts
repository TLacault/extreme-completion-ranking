import { describe, it, expect, beforeEach, vi } from 'vitest'
import { matchRank, refreshRanks, type RemoteLevel } from './rankSync'
import type { Level } from '../types'

function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'lvl_1',
    rank: 1,
    name: 'Society',
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

const remote: RemoteLevel[] = [
  { levelId: 127323087, position: 1, name: 'Society' },
  { levelId: 119544028, position: 2, name: 'Thinking Space II' },
  { levelId: 999, position: 3, name: 'Duplicate Name' },
  { levelId: 998, position: 4, name: 'Duplicate Name' },
]

describe('matchRank', () => {
  it('matches by numeric levelId when set', () => {
    const level = makeLevel({ name: 'Something Else', levelId: '127323087' })
    expect(matchRank(level, remote)).toBe(1)
  })

  it('falls back to unambiguous case-insensitive name match when levelId is blank', () => {
    const level = makeLevel({ name: 'thinking space ii', levelId: '' })
    expect(matchRank(level, remote)).toBe(2)
  })

  it('returns null when name matches more than one remote entry', () => {
    const level = makeLevel({ name: 'Duplicate Name', levelId: '' })
    expect(matchRank(level, remote)).toBeNull()
  })

  it('returns null when neither levelId nor name match anything', () => {
    const level = makeLevel({ name: 'Nonexistent Level', levelId: '123' })
    expect(matchRank(level, remote)).toBeNull()
  })
})

describe('refreshRanks', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function mockFetchSuccess(aredlData: unknown, dlPages: unknown[][]) {
    let dlCallCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('aredl.net')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(aredlData) })
        }
        const page = dlPages[dlCallCount] ?? []
        dlCallCount++
        return Promise.resolve({ ok: true, json: () => Promise.resolve(page) })
      }),
    )
  }

  it('applies aredlRank and dlRank when a level matches both lists by levelId', async () => {
    mockFetchSuccess(
      [{ level_id: 127323087, position: 606, name: 'Auditory Breaker' }],
      [[{ level_id: 127323087, position: 447, name: 'Auditory Breaker', id: 1 }]],
    )
    const levels = [makeLevel({ id: 'lvl_1', name: 'Auditory Breaker', levelId: '127323087' })]
    const updateLevel = vi.fn()

    const result = await refreshRanks(levels, updateLevel)

    expect(result.aredlOk).toBe(true)
    expect(result.dlOk).toBe(true)
    expect(result.matchedCount).toBe(2)
    expect(updateLevel).toHaveBeenCalledWith('lvl_1', { aredlRank: 606 })
    expect(updateLevel).toHaveBeenCalledWith('lvl_1', { dlRank: 447 })
  })

  it('does not call updateLevel for a level with no match in either list', async () => {
    mockFetchSuccess([{ level_id: 1, position: 1, name: 'Other' }], [[]])
    const levels = [makeLevel({ id: 'lvl_1', name: 'Unmatched Level', levelId: '' })]
    const updateLevel = vi.fn()

    await refreshRanks(levels, updateLevel)

    expect(updateLevel).not.toHaveBeenCalled()
  })

  it('leaves levels untouched and reports an error when the AREDL fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('aredl.net')) {
          return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }),
    )
    const levels = [makeLevel()]
    const updateLevel = vi.fn()

    const result = await refreshRanks(levels, updateLevel)

    expect(result.aredlOk).toBe(false)
    expect(result.error).toBeTruthy()
    expect(updateLevel).not.toHaveBeenCalled()
  })

  it('leaves levels untouched and reports an error when the DL fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('aredl.net')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) })
      }),
    )
    const levels = [makeLevel()]
    const updateLevel = vi.fn()

    const result = await refreshRanks(levels, updateLevel)

    expect(result.dlOk).toBe(false)
    expect(result.error).toBeTruthy()
    expect(updateLevel).not.toHaveBeenCalled()
  })
})
