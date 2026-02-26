import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.stubEnv('VERCEL_TOKEN', 'test-token')

import { createVercelProject, getVercelProject } from '../vercel-api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createVercelProject', () => {
  it('creates a project with the given name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prj_123', name: 'my-site' }),
    })

    const result = await createVercelProject('my-site')

    expect(result).toEqual({ id: 'prj_123', name: 'my-site' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v10/projects'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"my-site"'),
      }),
    )
  })

  it('includes git repository when gitRepo is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prj_123', name: 'my-site' }),
    })

    await createVercelProject('my-site', 'owner/repo')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.gitRepository).toEqual({ type: 'github', repo: 'owner/repo' })
  })

  it('uses nextjs as the framework', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prj_123', name: 'my-site' }),
    })

    await createVercelProject('my-site')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.framework).toBe('nextjs')
  })

  it('returns existing project when project_already_exists error', async () => {
    // First call: project already exists
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { code: 'project_already_exists' } }),
    })
    // Second call: getVercelProject fallback
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prj_existing', name: 'my-site' }),
    })

    const result = await createVercelProject('my-site')

    expect(result).toEqual({ id: 'prj_existing', name: 'my-site' })
  })

  it('throws on other error codes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { code: 'forbidden', message: 'Access denied' } }),
    })

    await expect(createVercelProject('my-site')).rejects.toThrow(
      'Failed to create Vercel project',
    )
  })
})

describe('getVercelProject', () => {
  it('fetches project by name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prj_123', name: 'my-site' }),
    })

    const result = await getVercelProject('my-site')

    expect(result).toEqual({ id: 'prj_123', name: 'my-site' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v9/projects/my-site'),
      expect.any(Object),
    )
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    })

    await expect(getVercelProject('missing')).rejects.toThrow('Failed to get Vercel project')
  })

  it('encodes project names with special characters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'prj_123', name: 'my site' }),
    })

    await getVercelProject('my site')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v9/projects/my%20site'),
      expect.any(Object),
    )
  })
})
