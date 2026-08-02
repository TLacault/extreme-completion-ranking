import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchFeaturedYoutube, fetchAredlStats, AREDL_ACCOUNT } from './featuredCreator'

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

describe('fetchFeaturedYoutube', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_YOUTUBE_API_KEY', 'test-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('returns null without calling fetch when no API key is configured', async () => {
    vi.unstubAllEnvs()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resolves channel info, stats, and the latest video', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              snippet: { title: 'Stark [GD]', thumbnails: { medium: { url: 'https://example.com/avatar.jpg' } } },
              contentDetails: { relatedPlaylists: { uploads: 'UUxyz' } },
              statistics: { subscriberCount: '12300', viewCount: '456000' },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              snippet: {
                title: 'Latest Upload',
                description: 'A description',
                resourceId: { videoId: 'abc123' },
              },
            },
          ],
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toEqual({
      channelName: 'Stark [GD]',
      avatarUrl: 'https://example.com/avatar.jpg',
      subscriberCount: 12300,
      viewCount: 456000,
      video: { videoId: 'abc123', title: 'Latest Upload', description: 'A description' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('treats a hidden subscriber count as null', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              snippet: { title: 'Stark [GD]' },
              contentDetails: { relatedPlaylists: { uploads: 'UUxyz' } },
              statistics: { subscriberCount: '12300', viewCount: '456000', hiddenSubscriberCount: true },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ snippet: { title: 'Latest Upload', resourceId: { videoId: 'abc123' } } }] }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result?.subscriberCount).toBeNull()
    expect(result?.viewCount).toBe(456000)
  })

  it('returns null when the channel lookup fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, false))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toBeNull()
  })

  it('returns null when the channel has no uploads playlist', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ items: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toBeNull()
  })

  it('returns null when the playlist items lookup fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUxyz' } } }] }),
      )
      .mockResolvedValueOnce(jsonResponse({}, false))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toBeNull()
  })

  it('returns null when the uploads playlist is empty', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUxyz' } } }] }),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFeaturedYoutube('Stark-GD')

    expect(result).toBeNull()
  })
})

describe('fetchAredlStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns stats for the matching AREDL user id', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        data: [
          { rank: 999, total_points: 0, user: { id: 'someone-else' } },
          { rank: 20165, total_points: 0, user: { id: AREDL_ACCOUNT.userId } },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchAredlStats()

    expect(result).toEqual({ rank: 20165, totalPoints: 0 })
  })

  it('returns null when no entry matches the known user id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ rank: 1, total_points: 100, user: { id: 'someone-else' } }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchAredlStats()

    expect(result).toBeNull()
  })

  it('returns null when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, false))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchAredlStats()

    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchAredlStats()

    expect(result).toBeNull()
  })
})
