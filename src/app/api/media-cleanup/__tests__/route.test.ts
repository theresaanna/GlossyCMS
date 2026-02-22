import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetPayload = vi.fn()
vi.mock('payload', () => ({
  getPayload: () => mockGetPayload(),
}))

vi.mock('@payload-config', () => ({ default: {} }))

import { POST } from '../route'

function makeRequest(authHeader?: string) {
  const headers: Record<string, string> = {}
  if (authHeader) headers['authorization'] = authHeader
  return new NextRequest('http://localhost/api/media-cleanup', {
    method: 'POST',
    headers,
  })
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    find: vi.fn().mockResolvedValue({ docs: [], hasNextPage: false }),
    delete: vi.fn().mockResolvedValue({}),
    logger: { info: vi.fn(), error: vi.fn() },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SITE_API_KEY', 'test-api-key')
})

describe('POST /api/media-cleanup', () => {
  it('returns 404 when SITE_API_KEY is not configured', async () => {
    vi.stubEnv('SITE_API_KEY', '')

    const res = await POST(makeRequest('Bearer something'))
    expect(res.status).toBe(404)
  })

  it('returns 401 when auth header is missing', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 when auth header has wrong key', async () => {
    const res = await POST(makeRequest('Bearer wrong-key'))
    expect(res.status).toBe(401)
  })

  it('returns deleted: 0 when no audio/video media exists', async () => {
    const mockPayload = makePayload()
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await POST(makeRequest('Bearer test-api-key'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ deleted: 0 })
  })

  it('deletes audio/video media and returns count', async () => {
    const mockPayload = makePayload()
    mockPayload.find
      .mockResolvedValueOnce({
        docs: [
          { id: 1, mimeType: 'video/mp4' },
          { id: 2, mimeType: 'audio/mpeg' },
        ],
        hasNextPage: false,
      })
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await POST(makeRequest('Bearer test-api-key'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ deleted: 2 })

    expect(mockPayload.delete).toHaveBeenCalledTimes(2)
    expect(mockPayload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'media', id: 1, overrideAccess: true }),
    )
    expect(mockPayload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'media', id: 2, overrideAccess: true }),
    )
  })

  it('continues deleting when individual delete fails', async () => {
    const mockPayload = makePayload()
    mockPayload.find.mockResolvedValueOnce({
      docs: [
        { id: 1, mimeType: 'video/mp4' },
        { id: 2, mimeType: 'audio/mpeg' },
      ],
      hasNextPage: false,
    })
    mockPayload.delete
      .mockRejectedValueOnce(new Error('Delete failed'))
      .mockResolvedValueOnce({})
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await POST(makeRequest('Bearer test-api-key'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ deleted: 1 })

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete media 1'),
    )
  })

  it('handles paginated results', async () => {
    const mockPayload = makePayload()
    mockPayload.find
      .mockResolvedValueOnce({
        docs: [{ id: 1, mimeType: 'video/mp4' }],
        hasNextPage: true,
      })
      .mockResolvedValueOnce({
        docs: [{ id: 2, mimeType: 'audio/mpeg' }],
        hasNextPage: false,
      })
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await POST(makeRequest('Bearer test-api-key'))
    expect(await res.json()).toEqual({ deleted: 2 })

    // Should have queried twice (two pages)
    expect(mockPayload.find).toHaveBeenCalledTimes(2)
  })
})
