import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchLatestVideo } from './featuredVideo'

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response
}

describe('fetchLatestVideo', () => {
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

    const result = await fetchLatestVideo('Stark-GD')

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resolves the uploads playlist then the latest video', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUxyz' } } }] }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          items: [{ snippet: { title: 'Latest Upload', resourceId: { videoId: 'abc123' } } }],
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchLatestVideo('Stark-GD')

    expect(result).toEqual({ videoId: 'abc123', title: 'Latest Upload' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns null when the channel lookup fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({}, false))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchLatestVideo('Stark-GD')

    expect(result).toBeNull()
  })

  it('returns null when the channel has no uploads playlist', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ items: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchLatestVideo('Stark-GD')

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

    const result = await fetchLatestVideo('Stark-GD')

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

    const result = await fetchLatestVideo('Stark-GD')

    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchLatestVideo('Stark-GD')

    expect(result).toBeNull()
  })
})
