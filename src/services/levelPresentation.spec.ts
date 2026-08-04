import { describe, it, expect } from 'vitest'
import {
  attemptsLabel,
  bestRunLabel,
  dateLabel,
  heatClass,
  listBadge,
  pipStyle,
  rankMedal,
  statusBadge,
} from './levelPresentation'
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

describe('heatClass', () => {
  it('returns no class when attempts are unknown', () => {
    expect(heatClass(null)).toBe('')
  })

  it('escalates at the 2k / 5k / 10k boundaries', () => {
    expect(heatClass(1999)).toBe('')
    expect(heatClass(2000)).toBe('heat-1')
    expect(heatClass(4999)).toBe('heat-1')
    expect(heatClass(5000)).toBe('heat-2')
    expect(heatClass(9999)).toBe('heat-2')
    expect(heatClass(10000)).toBe('heat-3')
  })
})

describe('rankMedal', () => {
  it('awards medals to the top three only', () => {
    expect(rankMedal(1)?.className).toBe('medal-gold')
    expect(rankMedal(2)?.className).toBe('medal-silver')
    expect(rankMedal(3)?.className).toBe('medal-bronze')
    expect(rankMedal(4)).toBeNull()
  })
})

describe('listBadge', () => {
  it('returns nothing for an unranked level', () => {
    expect(listBadge(null)).toBeNull()
  })

  it('splits Main / Extended / Legacy at 75 and 150', () => {
    expect(listBadge(75)?.label).toBe('Main')
    expect(listBadge(76)?.label).toBe('Extended')
    expect(listBadge(150)?.label).toBe('Extended')
    expect(listBadge(151)?.label).toBe('Legacy')
  })
})

describe('statusBadge', () => {
  it('maps each status to its badge', () => {
    expect(statusBadge(makeLevel({ status: 'completed' })).label).toBe('Completed')
    expect(statusBadge(makeLevel({ status: 'in_progress' })).label).toBe('Current')
    expect(statusBadge(makeLevel({ status: 'planned' })).label).toBe('Planned')
  })
})

describe('bestRunLabel', () => {
  it('reports 100% for completed levels regardless of stored range', () => {
    expect(bestRunLabel(makeLevel({ status: 'completed', bestRunMin: 12, bestRunMax: 40 }))).toBe('100%')
  })

  it('omits the midpoint when the range starts at zero', () => {
    expect(bestRunLabel(makeLevel({ status: 'in_progress', bestRunMin: 0, bestRunMax: 60 }))).toBe('0% - 60%')
  })

  it('includes a rounded midpoint for a non-zero range', () => {
    expect(bestRunLabel(makeLevel({ status: 'in_progress', bestRunMin: 30, bestRunMax: 61 }))).toBe('30% - 61% (46%)')
  })

  it('drops the midpoint and spacing in compact mode', () => {
    const level = makeLevel({ status: 'in_progress', bestRunMin: 30, bestRunMax: 61 })
    expect(bestRunLabel(level, true)).toBe('30-61%')
  })

  it('still reports 100% for completed levels in compact mode', () => {
    expect(bestRunLabel(makeLevel({ status: 'completed' }), true)).toBe('100%')
  })
})

describe('attemptsLabel', () => {
  it('prefers the count, falls back to the note, then an em dash', () => {
    expect(attemptsLabel(makeLevel({ attempts: 38214 }))).toBe((38214).toLocaleString())
    expect(attemptsLabel(makeLevel({ attempts: null, attemptsNote: 'lost count' }))).toBe('lost count')
    expect(attemptsLabel(makeLevel({ attempts: null, attemptsNote: '' }))).toBe('—')
  })
})

describe('dateLabel', () => {
  it('prefers the date, falls back to the note, then an em dash', () => {
    expect(dateLabel(makeLevel({ date: '2024-11-03' }))).toBe('2024-11-03')
    expect(dateLabel(makeLevel({ date: null, dateNote: 'two years ago' }))).toBe('two years ago')
    expect(dateLabel(makeLevel({ date: null, dateNote: '' }))).toBe('—')
  })
})

describe('pipStyle', () => {
  it('leaves unlit pips unstyled so the CSS default shows through', () => {
    expect(pipStyle(7, 5)).toEqual({})
  })

  it('colours lit pips along the violet → magenta → lime ramp', () => {
    // Ends are exact; the midpoint falls between pips 5 and 6, so neither is pure magenta.
    expect(pipStyle(1, 10).background).toBe('rgb(123, 47, 247)')
    expect(pipStyle(10, 10).background).toBe('rgb(198, 255, 61)')
    // Pip 5 is just short of magenta, pip 6 just past it toward lime.
    expect(pipStyle(5, 10).background).toBe('rgb(240, 59, 164)')
    expect(pipStyle(6, 10).background).toBe('rgb(249, 83, 144)')
  })

  it('attaches a glow matching the pip colour', () => {
    expect(pipStyle(1, 10).boxShadow).toBe('0 0 4px rgba(123, 47, 247, 0.7)')
  })
})
