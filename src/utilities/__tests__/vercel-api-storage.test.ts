import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.stubEnv('VERCEL_TOKEN', 'test-token')

import { setVercelEnvVars, addVercelDomain, triggerVercelDeploy, generateSecret } from '../vercel-api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setVercelEnvVars', () => {
  it('creates env vars in bulk via POST', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await setVercelEnvVars('prj_123', { KEY1: 'val1', KEY2: 'val2' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v10/projects/prj_123/env'),
      expect.objectContaining({ method: 'POST' }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toHaveLength(2)
    expect(body[0]).toMatchObject({
      key: 'KEY1',
      value: 'val1',
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    })
  })

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Forbidden' } }),
    })

    await expect(setVercelEnvVars('prj_123', { KEY: 'val' })).rejects.toThrow(
      'Failed to set environment variables',
    )
  })
})

describe('addVercelDomain', () => {
  it('adds a domain to the project', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })

    await addVercelDomain('prj_123', 'mysite.example.com')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v10/projects/prj_123/domains'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'mysite.example.com' }),
      }),
    )
  })

  it('silently handles domain_already_in_use error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { code: 'domain_already_in_use' } }),
    })

    await expect(addVercelDomain('prj_123', 'existing.com')).resolves.toBeUndefined()
  })

  it('throws on other errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { code: 'forbidden' } }),
    })

    await expect(addVercelDomain('prj_123', 'bad.com')).rejects.toThrow(
      'Failed to add domain',
    )
  })
})

describe('triggerVercelDeploy', () => {
  it('triggers a production deployment', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'dpl_123' }),
    })

    const result = await triggerVercelDeploy('prj_123')

    expect(result).toEqual({ id: 'dpl_123' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v13/deployments'),
      expect.objectContaining({ method: 'POST' }),
    )

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.target).toBe('production')
    expect(body.project).toBe('prj_123')
  })

  it('includes gitSource when repoId is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'dpl_123' }),
    })

    await triggerVercelDeploy('prj_123', 12345)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.gitSource).toEqual({
      type: 'github',
      ref: 'main',
      repoId: '12345',
    })
  })

  it('converts numeric repoId to string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'dpl_123' }),
    })

    await triggerVercelDeploy('prj_123', 99999)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.gitSource.repoId).toBe('99999')
  })

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
    })

    await expect(triggerVercelDeploy('prj_123')).rejects.toThrow(
      'Failed to trigger deployment',
    )
  })
})

describe('generateSecret', () => {
  it('returns a 64-character hex string', () => {
    const secret = generateSecret()

    expect(secret).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique values on each call', () => {
    const a = generateSecret()
    const b = generateSecret()

    expect(a).not.toBe(b)
  })
})
