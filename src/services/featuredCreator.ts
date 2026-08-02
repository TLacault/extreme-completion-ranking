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
  subscriberCount: number | null
  viewCount: number | null
  video: FeaturedVideo
}

export const FALLBACK_YOUTUBE: FeaturedYoutube = {
  channelName: FEATURED_CHANNEL_NAME,
  avatarUrl: null,
  subscriberCount: null,
  viewCount: null,
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

// TODO: replace with his real extreme-completion count (AREDL's live count
// undercounts him since not all of his submissions are approved yet).
export const GD_ACCOUNT = {
  ign: 'STARKILLER33',
  extremes: 0,
  inGameRank: 8547,
}

export const AREDL_ACCOUNT = {
  name: 'STARK',
  userId: '75db4fde-e2cb-449c-a878-f1a5f4004616',
  searchName: 'STARK',
  profileUrl: 'https://aredl.net/profile/user/75db4fde-e2cb-449c-a878-f1a5f4004616',
}

interface ChannelsResponse {
  items?: {
    snippet?: { title?: string; thumbnails?: { medium?: { url?: string }; default?: { url?: string } } }
    contentDetails?: { relatedPlaylists?: { uploads?: string } }
    statistics?: { subscriberCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean }
  }[]
}

interface PlaylistItemsResponse {
  items?: { snippet?: { title?: string; description?: string; resourceId?: { videoId?: string } } }[]
}

interface AredlLeaderboardResponse {
  data?: { rank: number; total_points: number; user: { id: string } }[]
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const AREDL_LEADERBOARD_URL = 'https://api.aredl.net/v2/api/aredl/leaderboard'

export async function fetchFeaturedYoutube(handle: string): Promise<FeaturedYoutube | null> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const channelsRes = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails,statistics&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`,
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

    const stats = channel?.statistics
    const subscriberCount =
      stats && !stats.hiddenSubscriberCount && stats.subscriberCount !== undefined ? Number(stats.subscriberCount) : null
    const viewCount = stats?.viewCount !== undefined ? Number(stats.viewCount) : null

    return {
      channelName: channel?.snippet?.title ?? FEATURED_CHANNEL_NAME,
      avatarUrl: channel?.snippet?.thumbnails?.medium?.url ?? channel?.snippet?.thumbnails?.default?.url ?? null,
      subscriberCount,
      viewCount,
      video: { videoId, title, description: snippet?.description ?? '' },
    }
  } catch {
    return null
  }
}

export interface AredlStats {
  rank: number
  totalPoints: number
}

export async function fetchAredlStats(): Promise<AredlStats | null> {
  try {
    const res = await fetch(`${AREDL_LEADERBOARD_URL}?name_filter=${encodeURIComponent(AREDL_ACCOUNT.searchName)}`)
    if (!res.ok) return null
    const data = (await res.json()) as AredlLeaderboardResponse
    const entry = data.data?.find((item) => item.user.id === AREDL_ACCOUNT.userId)
    if (!entry) return null
    return { rank: entry.rank, totalPoints: entry.total_points }
  } catch {
    return null
  }
}
