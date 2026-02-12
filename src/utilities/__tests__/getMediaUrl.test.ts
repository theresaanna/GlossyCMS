import { describe, it, expect, vi } from 'vitest'

vi.mock('@/utilities/getURL', () => ({
  getClientSideURL: () => 'http://localhost:3000',
}))

import { getMediaUrl } from '../getMediaUrl'

describe('getMediaUrl', () => {
  it('returns empty string for null url', () => {
    expect(getMediaUrl(null)).toBe('')
  })

  it('returns empty string for undefined url', () => {
    expect(getMediaUrl(undefined)).toBe('')
  })

  it('returns absolute http URL as-is', () => {
    expect(getMediaUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
  })

  it('returns absolute https URL as-is', () => {
    expect(getMediaUrl('https://cdn.example.com/video.mp4')).toBe(
      'https://cdn.example.com/video.mp4',
    )
  })

  it('appends cache tag to absolute URL', () => {
    expect(getMediaUrl('https://cdn.example.com/image.jpg', 'v123')).toBe(
      'https://cdn.example.com/image.jpg?v123',
    )
  })

  it('prepends base URL to relative path', () => {
    expect(getMediaUrl('/media/photo.jpg')).toBe('http://localhost:3000/media/photo.jpg')
  })

  it('prepends base URL and appends cache tag to relative path', () => {
    expect(getMediaUrl('/media/photo.jpg', 'v456')).toBe(
      'http://localhost:3000/media/photo.jpg?v456',
    )
  })

  it('encodes special characters in cache tag', () => {
    expect(getMediaUrl('https://example.com/img.jpg', 'tag with spaces')).toBe(
      'https://example.com/img.jpg?tag%20with%20spaces',
    )
  })

  it('ignores empty string cache tag', () => {
    expect(getMediaUrl('https://example.com/img.jpg', '')).toBe('https://example.com/img.jpg')
  })

  it('ignores null cache tag', () => {
    expect(getMediaUrl('https://example.com/img.jpg', null)).toBe('https://example.com/img.jpg')
  })
})
