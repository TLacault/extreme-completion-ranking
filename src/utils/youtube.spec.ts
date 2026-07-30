import { describe, it, expect } from 'vitest'
import { getYoutubeVideoId } from './youtube'

describe('getYoutubeVideoId', () => {
  it('extracts the id from a youtube.com/watch url', () => {
    expect(getYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a youtu.be short url', () => {
    expect(getYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the id from a youtube.com/embed url', () => {
    expect(getYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('ignores extra query params after the id', () => {
    expect(getYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ')
    expect(getYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for a non-YouTube url', () => {
    expect(getYoutubeVideoId('https://vimeo.com/12345')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(getYoutubeVideoId('')).toBeNull()
  })

  it('returns null for a malformed url', () => {
    expect(getYoutubeVideoId('not a url')).toBeNull()
  })
})
