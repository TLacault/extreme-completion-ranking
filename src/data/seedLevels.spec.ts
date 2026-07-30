import { describe, it, expect } from 'vitest'
import { seedLevels } from './seedLevels'

describe('seedLevels', () => {
  it('has exactly 35 entries', () => {
    expect(seedLevels).toHaveLength(35)
  })

  it('has unique, sequential ranks from 1 to 35', () => {
    const ranks = seedLevels.map((l) => l.rank).sort((a, b) => a - b)
    expect(ranks).toEqual(Array.from({ length: 35 }, (_, i) => i + 1))
  })

  it('has unique non-empty ids and names for every entry', () => {
    const ids = new Set(seedLevels.map((l) => l.id))
    const names = new Set(seedLevels.map((l) => l.name))
    expect(ids.size).toBe(35)
    expect(names.size).toBe(35)
    for (const level of seedLevels) {
      expect(level.id.length).toBeGreaterThan(0)
      expect(level.name.length).toBeGreaterThan(0)
    }
  })

  it('preserves ambiguous attempts/dates as null with a verbatim note instead of guessing', () => {
    const prismaticHaze = seedLevels.find((l) => l.name === 'Prismatic Haze')!
    expect(prismaticHaze.attempts).toBeNull()
    expect(prismaticHaze.attemptsNote).toBe('lost atts ~5-10k')

    const aftermath = seedLevels.find((l) => l.name === 'Aftermath')!
    expect(aftermath.date).toBeNull()
    expect(aftermath.dateNote).toBe("y'a 2 an")
  })

  it('parses precise numeric/date values into their typed fields', () => {
    const auditoryBreaker = seedLevels.find((l) => l.name === 'Auditory Breaker')!
    expect(auditoryBreaker.aredlRank).toBe(569)
    expect(auditoryBreaker.dlRank).toBe(425)
    expect(auditoryBreaker.attempts).toBe(8232)
    expect(auditoryBreaker.date).toBe('2026-04-21')
    expect(auditoryBreaker.enjoyment).toBe(6)
  })

  it('defaults unspecified optional fields to blank rather than omitting them', () => {
    for (const level of seedLevels) {
      expect(typeof level.creator).toBe('string')
      expect(typeof level.videoUrl).toBe('string')
      expect(typeof level.levelId).toBe('string')
      expect(typeof level.notes).toBe('string')
    }
  })
})
