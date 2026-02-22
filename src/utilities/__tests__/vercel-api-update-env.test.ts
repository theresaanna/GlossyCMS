import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

// Set required env vars before importing
vi.stubEnv('VERCEL_TOKEN', 'test-token')

import { updateVercelEnvVars } from '../vercel-api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateVercelEnvVars', () => {
  it('fetches existing env vars and patches matching ones', async () => {
    // First call: list existing env vars
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          envs: [
            { id: 'env_1', key: 'SITE_PLAN' },
            { id: 'env_2', key: 'OTHER_VAR' },
          ],
        }),
    })
    // Second call: patch SITE_PLAN
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await updateVercelEnvVars('prj_abc', { SITE_PLAN: 'pro' })

    // Should have listed env vars
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v10/projects/prj_abc/env'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) }),
    )

    // Should have patched the existing env var
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v10/projects/prj_abc/env/env_1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ value: 'pro' }),
      }),
    )
  })

  it('creates env var when it does not exist', async () => {
    // First call: list existing env vars (empty)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ envs: [] }),
    })
    // Second call: create new env var
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await updateVercelEnvVars('prj_abc', { NEW_VAR: 'value' })

    // Should have created via POST
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v10/projects/prj_abc/env'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('NEW_VAR'),
      }),
    )
  })

  it('throws when listing env vars fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Not found' } }),
    })

    await expect(updateVercelEnvVars('prj_abc', { SITE_PLAN: 'pro' })).rejects.toThrow(
      'Failed to list environment variables',
    )
  })

  it('throws when patching an env var fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ envs: [{ id: 'env_1', key: 'SITE_PLAN' }] }),
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Patch failed' } }),
    })

    await expect(updateVercelEnvVars('prj_abc', { SITE_PLAN: 'pro' })).rejects.toThrow(
      'Failed to update env var "SITE_PLAN"',
    )
  })

  it('handles multiple env vars — some existing, some new', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          envs: [{ id: 'env_1', key: 'SITE_PLAN' }],
        }),
    })
    // Patch existing
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    // Create new
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await updateVercelEnvVars('prj_abc', {
      SITE_PLAN: 'basic',
      NEXT_PUBLIC_SITE_PLAN: 'basic',
    })

    expect(mockFetch).toHaveBeenCalledTimes(3) // 1 list + 1 patch + 1 create
  })
})
