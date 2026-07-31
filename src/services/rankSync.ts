import type { Level } from '../types'

export const AREDL_URL = 'https://api.aredl.net/v2/api/aredl/levels'
const DL_URL = 'https://pointercrate.com/api/v2/demons/'

export interface RemoteLevel {
  levelId: number
  position: number
  name: string
}

export interface SyncResult {
  aredlOk: boolean
  dlOk: boolean
  matchedCount: number
  error: string | null
}

interface RawRemoteLevel {
  level_id: number
  position: number
  name: string
}

export interface RawAredlLevel extends RawRemoteLevel {
  publisher_id: string
}

export interface RawDemon extends RawRemoteLevel {
  id: number
  video: string | null
  publisher: { id: number; name: string; banned: boolean }
}

function normalize(raw: RawRemoteLevel): RemoteLevel {
  return { levelId: raw.level_id, position: raw.position, name: raw.name }
}

export async function fetchAredlRawLevels(): Promise<RawAredlLevel[]> {
  const res = await fetch(AREDL_URL)
  if (!res.ok) throw new Error(`AREDL request failed with status ${res.status}`)
  return (await res.json()) as RawAredlLevel[]
}

export async function fetchDlRawLevels(): Promise<RawDemon[]> {
  const all: RawDemon[] = []
  let after = 0
  for (;;) {
    const res = await fetch(`${DL_URL}?after=${after}&limit=100`)
    if (!res.ok) throw new Error(`DL request failed with status ${res.status}`)
    const page = (await res.json()) as RawDemon[]
    if (page.length === 0) break
    all.push(...page)
    if (page.length < 100) break
    after = Math.max(...page.map((item) => item.id))
  }
  return all
}

export async function fetchAredlLevels(): Promise<RemoteLevel[]> {
  return (await fetchAredlRawLevels()).map(normalize)
}

export async function fetchDlLevels(): Promise<RemoteLevel[]> {
  return (await fetchDlRawLevels()).map(normalize)
}

export function matchRank(level: Pick<Level, 'levelId' | 'name'>, remote: RemoteLevel[]): number | null {
  const numericId = Number(level.levelId)
  if (level.levelId.trim() !== '' && !Number.isNaN(numericId)) {
    const byId = remote.find((entry) => entry.levelId === numericId)
    if (byId) return byId.position
  }

  const nameMatches = remote.filter((entry) => entry.name.toLowerCase() === level.name.toLowerCase())
  return nameMatches.length === 1 ? nameMatches[0].position : null
}

export async function refreshRanks(
  levels: Level[],
  updateLevel: (id: string, patch: Partial<Level>) => void,
): Promise<SyncResult> {
  const [aredlResult, dlResult] = await Promise.allSettled([fetchAredlLevels(), fetchDlLevels()])
  const aredlOk = aredlResult.status === 'fulfilled'
  const dlOk = dlResult.status === 'fulfilled'

  if (!aredlOk || !dlOk) {
    const reasons = [
      !aredlOk ? `AREDL: ${(aredlResult as PromiseRejectedResult).reason}` : null,
      !dlOk ? `DL: ${(dlResult as PromiseRejectedResult).reason}` : null,
    ].filter(Boolean)
    return { aredlOk, dlOk, matchedCount: 0, error: reasons.join('; ') }
  }

  let matchedCount = 0
  for (const level of levels) {
    const aredlRank = matchRank(level, aredlResult.value)
    if (aredlRank !== null) {
      updateLevel(level.id, { aredlRank })
      matchedCount++
    }
    const dlRank = matchRank(level, dlResult.value)
    if (dlRank !== null) {
      updateLevel(level.id, { dlRank })
      matchedCount++
    }
  }

  return { aredlOk, dlOk, matchedCount, error: null }
}
