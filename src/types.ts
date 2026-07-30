export interface Level {
  id: string
  rank: number
  name: string
  aredlRank: number | null
  dlRank: number | null
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
