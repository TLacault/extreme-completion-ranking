import starkTwitchAvatar from '../assets/stark-pfp.jpg'

export const FEATURED_CHANNEL_HANDLE = 'Stark-GD'
export const FEATURED_CHANNEL_NAME = 'Stark [GD]'

export interface FeaturedVideo {
  videoId: string
  title: string
  description: string
}

export interface FeaturedYoutube {
  channelName: string
  avatarUrl: string | null
  video: FeaturedVideo
}

export const FALLBACK_YOUTUBE: FeaturedYoutube = {
  channelName: FEATURED_CHANNEL_NAME,
  avatarUrl: null,
  video: {
    videoId: 'KXjEscmAALQ',
    title: 'Astral Divinity 100% // New Hardest Extreme Demon // TOP 433',
    description: '',
  },
}

export const TWITCH_CONFIG = {
  name: FEATURED_CHANNEL_NAME,
  url: 'https://www.twitch.tv/starkgd',
  schedule: '9 PM EST, daily',
  avatarUrl: starkTwitchAvatar,
}

export const GD_ACCOUNT = {
  ign: 'STARKILLER33',
  inGameRank: 8547,
  aredlUserId: '75db4fde-e2cb-449c-a878-f1a5f4004616',
  aredlSearchName: 'STARK',
}

interface ChannelsResponse {
  items?: {
    snippet?: { title?: string; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } }
    contentDetails?: { relatedPlaylists?: { uploads?: string } }
  }[]
}

interface PlaylistItemsResponse {
  items?: { snippet?: { title?: string; description?: string; resourceId?: { videoId?: string } } }[]
}

interface AredlLeaderboardResponse {
  data?: { rank: number; total_points: number; extremes: number; user: { id: string } }[]
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const AREDL_LEADERBOARD_URL = 'https://api.aredl.net/v2/api/aredl/leaderboard'

export async function fetchFeaturedYoutube(handle: string): Promise<FeaturedYoutube | null> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const channelsRes = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`,
    )
    if (!channelsRes.ok) return null
    const channelsData = (await channelsRes.json()) as ChannelsResponse
    const channel = channelsData.items?.[0]
    const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) return null

    const playlistRes = await fetch(
      `${YOUTUBE_API_BASE}/playlistItems?part=snippet&maxResults=1&playlistId=${encodeURIComponent(uploadsPlaylistId)}&key=${apiKey}`,
    )
    if (!playlistRes.ok) return null
    const playlistData = (await playlistRes.json()) as PlaylistItemsResponse
    const snippet = playlistData.items?.[0]?.snippet
    const videoId = snippet?.resourceId?.videoId
    const title = snippet?.title
    if (!videoId || !title) return null

    return {
      channelName: channel?.snippet?.title ?? FEATURED_CHANNEL_NAME,
      avatarUrl: channel?.snippet?.thumbnails?.medium?.url ?? channel?.snippet?.thumbnails?.default?.url ?? null,
      video: { videoId, title, description: snippet?.description ?? '' },
    }
  } catch {
    return null
  }
}

export interface GdStats {
  rank: number
  totalPoints: number
  extremes: number
}

export async function fetchGdStats(): Promise<GdStats | null> {
  try {
    const res = await fetch(`${AREDL_LEADERBOARD_URL}?name_filter=${encodeURIComponent(GD_ACCOUNT.aredlSearchName)}`)
    if (!res.ok) return null
    const data = (await res.json()) as AredlLeaderboardResponse
    const entry = data.data?.find((item) => item.user.id === GD_ACCOUNT.aredlUserId)
    if (!entry) return null
    return { rank: entry.rank, totalPoints: entry.total_points, extremes: entry.extremes }
  } catch {
    return null
  }
}
