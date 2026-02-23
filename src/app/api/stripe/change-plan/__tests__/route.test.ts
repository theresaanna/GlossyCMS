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

  return new NextRequest('http://localhost/api/stripe/change-plan', {
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
    plan: 'basic' as const,
    status: 'active' as const,
    siteApiKey: 'valid-api-key',
    stripeSubscriptionId: 'sub_123',
    stripeCustomerId: 'cus_123',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('IS_PRIMARY_INSTANCE', 'true')
  vi.stubEnv('STRIPE_BASIC_PRICE_ID', 'price_basic')
  vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro')
})

describe('POST /api/stripe/change-plan', () => {
  it('returns 404 when not on primary instance', async () => {
    vi.stubEnv('IS_PRIMARY_INSTANCE', 'false')

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(404)
  })

  it('returns 401 when no authorization header is provided', async () => {
    const res = await POST(makeRequest(undefined, { plan: 'pro' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when request body is missing', async () => {
    const res = await POST(makeRequest('valid-api-key'))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('Invalid request body')
  })

  it('returns 400 when plan is invalid', async () => {
    const res = await POST(makeRequest('valid-api-key', { plan: 'enterprise' }))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toMatch(/Invalid plan/)
  })

  it('returns 404 when no site matches the API key', async () => {
    const payload = makePayload()
    mockGetPayload.mockResolvedValue(payload)

    const res = await POST(makeRequest('invalid-key', { plan: 'pro' }))
    expect(res.status).toBe(404)

    expect(payload.find).toHaveBeenCalledWith({
      collection: 'provisioned-sites',
      overrideAccess: true,
      where: { siteApiKey: { equals: 'invalid-key' } },
      limit: 1,
    })
  })

  it('returns 400 when site has no stripeSubscriptionId', async () => {
    const site = makeSite({ stripeSubscriptionId: null })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('No active subscription found')
  })

  it('returns 400 when site is already on the requested plan', async () => {
    const site = makeSite({ plan: 'pro' })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(400)

    const data = await res.json()
    expect(data.error).toBe('Site is already on the pro plan')
  })

  it('returns 500 when price ID env var is missing', async () => {
    vi.stubEnv('STRIPE_PRO_PRICE_ID', '')

    const site = makeSite({ plan: 'basic' })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('Plan pricing is not configured')
  })

  it('upgrades a subscription from basic to pro', async () => {
    const site = makeSite({ plan: 'basic' })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const mockSubscriptionsRetrieve = vi.fn().mockResolvedValue({
      items: { data: [{ id: 'si_item_1', price: { id: 'price_basic' } }] },
    })
    const mockSubscriptionsUpdate = vi.fn().mockResolvedValue({
      id: 'sub_123',
      items: { data: [{ id: 'si_item_1', price: { id: 'price_pro' } }] },
    })
    mockGetStripe.mockReturnValue({
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
        update: mockSubscriptionsUpdate,
      },
    })

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_123')
    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
      items: [{ id: 'si_item_1', price: 'price_pro' }],
      proration_behavior: 'create_prorations',
    })
  })

  it('downgrades a subscription from pro to basic', async () => {
    const site = makeSite({ plan: 'pro' })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    const mockSubscriptionsRetrieve = vi.fn().mockResolvedValue({
      items: { data: [{ id: 'si_item_1', price: { id: 'price_pro' } }] },
    })
    const mockSubscriptionsUpdate = vi.fn().mockResolvedValue({
      id: 'sub_123',
      items: { data: [{ id: 'si_item_1', price: { id: 'price_basic' } }] },
    })
    mockGetStripe.mockReturnValue({
      subscriptions: {
        retrieve: mockSubscriptionsRetrieve,
        update: mockSubscriptionsUpdate,
      },
    })

    const res = await POST(makeRequest('valid-api-key', { plan: 'basic' }))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)

    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
      items: [{ id: 'si_item_1', price: 'price_basic' }],
      proration_behavior: 'create_prorations',
    })
  })

  it('returns 500 when subscription has no items', async () => {
    const site = makeSite({ plan: 'basic' })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    mockGetStripe.mockReturnValue({
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({ items: { data: [] } }),
      },
    })

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('Subscription has no items')
  })

  it('returns 500 when Stripe update fails', async () => {
    const site = makeSite({ plan: 'basic' })
    const payload = makePayload({
      find: vi.fn().mockResolvedValue({ docs: [site] }),
    })
    mockGetPayload.mockResolvedValue(payload)

    mockGetStripe.mockReturnValue({
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          items: { data: [{ id: 'si_item_1', price: { id: 'price_basic' } }] },
        }),
        update: vi.fn().mockRejectedValue(new Error('Stripe error')),
      },
    })

    const res = await POST(makeRequest('valid-api-key', { plan: 'pro' }))
    expect(res.status).toBe(500)

    const data = await res.json()
    expect(data.error).toBe('Failed to update subscription. Please try again.')
  })
})
