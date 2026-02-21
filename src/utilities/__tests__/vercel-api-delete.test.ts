import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

// Set required env vars before importing
vi.stubEnv('VERCEL_TOKEN', 'test-token')

import { deleteVercelProject } from '../vercel-api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteVercelProject', () => {
  it('calls DELETE on the correct Vercel API endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 })

    await deleteVercelProject('prj_abc123')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v9/projects/prj_abc123'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('succeeds silently on 404 response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })

    await expect(deleteVercelProject('prj_nonexistent')).resolves.toBeUndefined()
  })

  it('throws on non-ok, non-404 responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Internal server error' } }),
    })

    await expect(deleteVercelProject('prj_abc123')).rejects.toThrow(
      'Failed to delete Vercel project',
    )
  })

  it('includes authorization header', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 })

    await deleteVercelProject('prj_abc123')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })
})
