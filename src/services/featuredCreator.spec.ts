import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchFeaturedYoutube, fetchGdStats, GD_ACCOUNT } from './featuredCreator'

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

  it('resolves channel info then the latest video', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              snippet: { title: 'Stark [GD]', thumbnails: { medium: { url: 'https://example.com/avatar.jpg' } } },
              contentDetails: { relatedPlaylists: { uploads: 'UUxyz' } },
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
      video: { videoId: 'abc123', title: 'Latest Upload', description: 'A description' },
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
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

describe('fetchGdStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns stats for the matching AREDL user id', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        data: [
          { rank: 999, total_points: 0, extremes: 0, user: { id: 'someone-else' } },
          { rank: 20165, total_points: 0, extremes: 0, user: { id: GD_ACCOUNT.aredlUserId } },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchGdStats()

    expect(result).toEqual({ rank: 20165, totalPoints: 0, extremes: 0 })
  })

  it('returns null when no entry matches the known user id', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ data: [{ rank: 1, total_points: 100, extremes: 5, user: { id: 'someone-else' } }] }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchGdStats()

    expect(result).toBeNull()
  })

  it('returns null when the request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, false))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchGdStats()

    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchGdStats()

    expect(result).toBeNull()
  })
})
