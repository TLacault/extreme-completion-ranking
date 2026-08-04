import {
  CircleCheck,
  Crown,
  Hourglass,
  ListTodo,
  Medal,
  type LucideIcon,
} from '@lucide/vue'
import type { Level, LevelStatus } from '../types'
import { bestRunRange, levelStatus } from '../composables/useLevels'

/** Shared presentation rules for a level, used by both the table and the card list. */

export function heatClass(attempts: number | null): string {
  if (attempts === null) return ''
  if (attempts >= 10000) return 'heat-3'
  if (attempts >= 5000) return 'heat-2'
  if (attempts >= 2000) return 'heat-1'
  return ''
}

const MEDALS: Record<number, { icon: LucideIcon; className: string }> = {
  1: { icon: Crown, className: 'medal-gold' },
  2: { icon: Medal, className: 'medal-silver' },
  3: { icon: Medal, className: 'medal-bronze' },
}

export function rankMedal(position: number) {
  return MEDALS[position] ?? null
}

const LIST_TIERS: { max: number; label: string; className: string }[] = [
  { max: 75, label: 'Main', className: 'badge-main' },
  { max: 150, label: 'Extended', className: 'badge-extended' },
  { max: Infinity, label: 'Legacy', className: 'badge-legacy' },
]

export function listBadge(dlRank: number | null) {
  if (dlRank === null) return null
  return LIST_TIERS.find((tier) => dlRank <= tier.max) ?? null
}

const STATUS_BADGES: Record<LevelStatus, { label: string; icon: LucideIcon; className: string }> = {
  completed: { label: 'Completed', icon: CircleCheck, className: 'status-completed' },
  in_progress: { label: 'Current', icon: Hourglass, className: 'status-in-progress' },
  planned: { label: 'Planned', icon: ListTodo, className: 'status-planned' },
}

export function statusBadge(level: Level) {
  return STATUS_BADGES[levelStatus(level)]
}

/**
 * `compact` drops the midpoint and spacing for short landscape viewports, where
 * the full form is the widest cell in the table. The midpoint is derivable from
 * the range, so nothing is actually lost.
 */
export function bestRunLabel(level: Level, compact = false): string {
  if (levelStatus(level) === 'completed') return '100%'
  const { min, max } = bestRunRange(level)
  if (compact) return `${min}-${max}%`
  if (min === 0) return `${min}% - ${max}%`
  const mid = Math.round((min + max) / 2)
  return `${min}% - ${max}% (${mid}%)`
}

export function attemptsLabel(level: Level): string {
  return level.attempts !== null ? level.attempts.toLocaleString() : level.attemptsNote || '—'
}

export function dateLabel(level: Level): string {
  return level.date ?? (level.dateNote || '—')
}

const VIOLET: [number, number, number] = [123, 47, 247]
const MAGENTA: [number, number, number] = [255, 61, 154]
const LIME: [number, number, number] = [198, 255, 61]

function mixColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
  return `${r}, ${g}, ${b}`
}

/** Enjoyment pips run violet → magenta → lime across the 1-10 scale. */
export function pipColor(pip: number): string {
  const t = (pip - 1) / 9
  return t <= 0.5
    ? mixColor(VIOLET, MAGENTA, t / 0.5)
    : mixColor(MAGENTA, LIME, (t - 0.5) / 0.5)
}

export function pipStyle(pip: number, enjoyment: number): Record<string, string> {
  if (pip > enjoyment) return {}
  const color = pipColor(pip)
  return { background: `rgb(${color})`, boxShadow: `0 0 4px rgba(${color}, 0.7)` }
}
