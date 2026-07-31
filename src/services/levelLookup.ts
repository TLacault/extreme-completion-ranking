import { AREDL_URL, fetchAredlRawLevels, fetchDlRawLevels } from './rankSync'

export interface LookupEntry {
  levelId: number
  name: string
  aredlPosition: number | null
  dlPosition: number | null
  creator: string | null
  videoUrl: string | null
}

export interface AredlEnrichment {
  creator: string | null
  videoUrl: string | null
}

let cache: LookupEntry[] | null = null
let loadingPromise: Promise<LookupEntry[]> | null = null

async function loadAll(): Promise<LookupEntry[]> {
  if (cache) return cache
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const [aredlResult, dlResult] = await Promise.allSettled([fetchAredlRawLevels(), fetchDlRawLevels()])
    const byLevelId = new Map<number, LookupEntry>()

    if (aredlResult.status === 'fulfilled') {
      for (const item of aredlResult.value) {
        byLevelId.set(item.level_id, {
          levelId: item.level_id,
          name: item.name,
          aredlPosition: item.position,
          dlPosition: null,
          creator: null,
          videoUrl: null,
        })
      }
    }

    if (dlResult.status === 'fulfilled') {
      for (const item of dlResult.value) {
        const existing = byLevelId.get(item.level_id)
        if (existing) {
          existing.dlPosition = item.position
          existing.creator = existing.creator ?? item.publisher?.name ?? null
          existing.videoUrl = existing.videoUrl ?? item.video ?? null
        } else {
          byLevelId.set(item.level_id, {
            levelId: item.level_id,
            name: item.name,
            aredlPosition: null,
            dlPosition: item.position,
            creator: item.publisher?.name ?? null,
            videoUrl: item.video ?? null,
          })
        }
      }
    }

    const entries = Array.from(byLevelId.values())
    cache = entries
    return entries
  })()

  try {
    return await loadingPromise
  } finally {
    loadingPromise = null
  }
}

export async function searchLevels(query: string, limit = 8): Promise<LookupEntry[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const all = await loadAll()
  return all.filter((entry) => entry.name.toLowerCase().includes(q)).slice(0, limit)
}

export async function fetchAredlEnrichment(levelId: number): Promise<AredlEnrichment> {
  try {
    const res = await fetch(`${AREDL_URL}/${levelId}`)
    if (!res.ok) return { creator: null, videoUrl: null }
    const data = (await res.json()) as {
      publisher?: { username?: string; global_name?: string }
      verifications?: { video_url?: string }[]
    }
    const creator = data.publisher?.global_name || data.publisher?.username || null
    const videoUrl = data.verifications?.[0]?.video_url || null
    return { creator, videoUrl }
  } catch {
    return { creator: null, videoUrl: null }
  }
}
