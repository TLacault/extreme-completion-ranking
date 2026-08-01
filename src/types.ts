export type LevelStatus = 'completed' | 'in_progress' | 'planned'

export interface Level {
  id: string
  rank: number
  name: string
  status: LevelStatus
  aredlRank: number | null
  dlRank: number | null
  bestRunMin: number | null
  bestRunMax: number | null
  attempts: number | null
  attemptsNote: string
  date: string | null
  dateNote: string
  enjoyment: number | null
  creator: string
  videoUrl: string
  levelId: string
  notes: string
}
