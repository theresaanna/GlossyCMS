import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing the route
const mockGetStripe = vi.fn()
vi.mock('@/utilities/stripe', () => ({
  getStripe: () => mockGetStripe(),
}))

const mockGetPayload = vi.fn()
vi.mock('payload', () => ({
  getPayload: () => mockGetPayload(),
}))

vi.mock('@payload-config', () => ({ default: {} }))

import { POST } from '../route'

// Helpers
function makeRequest(apiKey?: string, body?: Record<string, unknown>) {
  const headers: Record<string, string> = {}
  if (apiKey) {
    headers['authorization'] = `Bearer ${apiKey}`
  }

  return new NextRequest('http://localhost/api/stripe/create-portal-session', {
    method: 'POST',
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { ...headers, 'content-type': 'application/json' },
        }
      : { headers }),
  })
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    ...overrides,
  }
}

function makeSite(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subdomain: 'test-site',
    ownerEmail: 'test@example.com',
    siteApiKey: 'valid-api-key',
    stripeCustomerId: 'cus_123',
    status: 'active',
    ...overrides,
  }
}

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv, IS_PRIMARY_INSTANCE: 'true' }
})

describe('POST /api/stripe/create-portal-session', () => {
  it('returns 404 when not on primary instance', async () => {
    process.env.IS_PRIMARY_INSTANCE = 'false'

    const res = await POST(makeRequest('valid-api-key'))
    expect(res.status).toBe(404)
  })

  it('returns 401 when no authorization header is provided', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 401 when authorization header is not Bearer', async () => {
    const req = new NextRequest('http://localhost/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { authorization: 'Basic abc123' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when no site matches the API key', async () => {
    const payload = makePayload()
    mockGetPayload.mockResolvedValue(payload)

    const res = await POST(makeRequest('invalid-key'))
    expect(res.status).toBe(404)

    expect(payload.find).toHaveBeenCalledWith({
      collection: 'provisioned-sites',
      overrideAccess: true,
      where: { siteApiKey: { equals: 'invalid-key' } },
      limit: 1,
    })
  })

  it('returns 400 when site has no stripeCustomerId', async () => {
    const site = makeSite({ stripeCustomerId: null })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const res = await POST(makeRequest('valid-api-key'))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('No billing account found')
  })

  it('creates a portal session and returns the URL', async () => {
    const site = makeSite()
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const mockSessionCreate = vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    })
    mockGetStripe.mockReturnValue({
      billingPortal: { sessions: { create: mockSessionCreate } },
    })

    const res = await POST(makeRequest('valid-api-key'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.url).toBe('https://billing.stripe.com/session/test')

    expect(mockSessionCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
    })
  })

  it('passes returnUrl when provided in the request body', async () => {
    const site = makeSite()
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const mockSessionCreate = vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    })
    mockGetStripe.mockReturnValue({
      billingPortal: { sessions: { create: mockSessionCreate } },
    })

    const res = await POST(
      makeRequest('valid-api-key', { returnUrl: 'https://test-site.glossysites.live/admin/subscription' }),
    )
    expect(res.status).toBe(200)

    expect(mockSessionCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'https://test-site.glossysites.live/admin/subscription',
    })
  })

  it('works without a request body (returnUrl is optional)', async () => {
    const site = makeSite()
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const mockSessionCreate = vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    })
    mockGetStripe.mockReturnValue({
      billingPortal: { sessions: { create: mockSessionCreate } },
    })

    // Request with no body at all
    const req = new NextRequest('http://localhost/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-api-key' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(mockSessionCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
    })
  })
})
