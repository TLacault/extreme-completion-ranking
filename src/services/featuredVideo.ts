export const FEATURED_CHANNEL_HANDLE = 'Stark-GD'
export const FEATURED_CHANNEL_NAME = 'Stark [GD]'

export const FALLBACK_VIDEO: FeaturedVideo = {
  videoId: 'KXjEscmAALQ',
  title: 'Astral Divinity 100% // New Hardest Extreme Demon // TOP 433',
}

export interface FeaturedVideo {
  videoId: string
  title: string
}

interface ChannelsResponse {
  items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[]
}

interface PlaylistItemsResponse {
  items?: { snippet?: { title?: string; resourceId?: { videoId?: string } } }[]
}

const API_BASE = 'https://www.googleapis.com/youtube/v3'

export async function fetchLatestVideo(handle: string): Promise<FeaturedVideo | null> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) return null

  try {
    const channelsRes = await fetch(
      `${API_BASE}/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`,
    )
    if (!channelsRes.ok) return null
    const channelsData = (await channelsRes.json()) as ChannelsResponse
    const uploadsPlaylistId = channelsData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) return null

    const playlistRes = await fetch(
      `${API_BASE}/playlistItems?part=snippet&maxResults=1&playlistId=${encodeURIComponent(uploadsPlaylistId)}&key=${apiKey}`,
    )
    if (!playlistRes.ok) return null
    const playlistData = (await playlistRes.json()) as PlaylistItemsResponse
    const snippet = playlistData.items?.[0]?.snippet
    const videoId = snippet?.resourceId?.videoId
    const title = snippet?.title
    if (!videoId || !title) return null

    return { videoId, title }
  } catch {
    return null
  }
}
