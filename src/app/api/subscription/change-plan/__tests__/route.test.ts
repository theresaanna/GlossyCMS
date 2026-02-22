import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing the route
const mockGetPayload = vi.fn()
vi.mock('payload', () => ({
  getPayload: () => mockGetPayload(),
}))

vi.mock('@payload-config', () => ({ default: {} }))

const mockHeaders = vi.fn()
vi.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { POST } from '../route'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  process.env = {
    ...originalEnv,
    SITE_API_KEY: 'test-site-api-key',
    NEXT_PUBLIC_SERVER_URL: 'https://test-site.glossysites.live',
    NEXT_PUBLIC_PRIMARY_URL: 'https://www.glossysites.live',
  }
})

function makeRequest(body?: Record<string, unknown>) {
  if (body) {
    return new NextRequest('http://localhost/api/subscription/change-plan', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
  }
  return new NextRequest('http://localhost/api/subscription/change-plan', {
    method: 'POST',
  })
}

describe('POST /api/subscription/change-plan', () => {
  it('returns 401 when user is not authenticated', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: null }),
    })

    const res = await POST(makeRequest({ plan: 'pro' }))
    expect(res.status).toBe(401)
  })

  it('returns 500 when SITE_API_KEY is not configured', async () => {
    delete process.env.SITE_API_KEY

    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    const res = await POST(makeRequest({ plan: 'pro' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('Billing is not configured for this site')
  })

  it('returns 400 when request body is missing', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('Invalid request body')
  })

  it('returns 400 when plan is invalid', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    const res = await POST(makeRequest({ plan: 'enterprise' }))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('Invalid plan')
  })

  it('proxies the request to the primary instance and returns success', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const res = await POST(makeRequest({ plan: 'pro' }))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.glossysites.live/api/stripe/change-plan',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-site-api-key',
        },
        body: JSON.stringify({ plan: 'pro' }),
      },
    )
  })

  it('returns the upstream error status when primary instance rejects the request', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Site is already on the pro plan' }),
    })

    const res = await POST(makeRequest({ plan: 'pro' }))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('Site is already on the pro plan')
  })

  it('returns 502 when the primary instance is unreachable', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const res = await POST(makeRequest({ plan: 'pro' }))
    expect(res.status).toBe(502)

    const data = await res.json()
    expect(data.error).toBe('Failed to connect to billing service')
  })

  it('handles upstream JSON parse errors gracefully', async () => {
    const headersList = new Headers()
    mockHeaders.mockReturnValue(headersList)

    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 1, email: 'user@example.com' } }),
    })

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    const res = await POST(makeRequest({ plan: 'pro' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('Failed to change plan')
  })
})
