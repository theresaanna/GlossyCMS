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

const mockUpdateVercelEnvVars = vi.fn()
const mockTriggerVercelDeploy = vi.fn()
const mockGetVercelProject = vi.fn()
vi.mock('@/utilities/vercel-api', () => ({
  updateVercelEnvVars: (...args: unknown[]) => mockUpdateVercelEnvVars(...args),
  triggerVercelDeploy: (...args: unknown[]) => mockTriggerVercelDeploy(...args),
  getVercelProject: (...args: unknown[]) => mockGetVercelProject(...args),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { POST } from '../route'

// Helpers
function makeRequest(body = 'test-body', signature = 'test-sig') {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: signature ? { 'stripe-signature': signature } : {},
  })
}

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
    findByID: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue({}),
    jobs: { queue: vi.fn().mockResolvedValue({}) },
    ...overrides,
  }
}

function makeSite(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subdomain: 'test-site',
    ownerEmail: 'test@example.com',
    plan: 'pro' as const,
    status: 'active' as const,
    stripeSubscriptionId: 'sub_123',
    stripeCustomerId: 'cus_123',
    vercelProjectId: 'prj_abc',
    siteApiKey: 'secret-key-123',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeStripeEvent(type: string, object: Record<string, unknown>) {
  return { type, data: { object } }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('IS_PRIMARY_INSTANCE', 'true')
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test')
  vi.stubEnv('STRIPE_BASIC_PRICE_ID', 'price_basic')
  vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_pro')
})

describe('POST /api/stripe/webhook', () => {
  it('returns 404 when not primary instance', async () => {
    vi.stubEnv('IS_PRIMARY_INSTANCE', 'false')

    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: 'test',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Missing signature' })
  })

  it('returns 400 when signature verification fails', async () => {
    mockGetStripe.mockReturnValue({
      webhooks: {
        constructEvent: () => {
          throw new Error('Invalid signature')
        },
      },
    })

    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid signature' })
  })

  describe('checkout.session.completed', () => {
    it('transitions site from pending_payment to pending and queues provisioning', async () => {
      const mockPayload = makePayload()
      const site = makeSite({ status: 'pending_payment' })
      mockPayload.findByID.mockResolvedValue(site)
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('checkout.session.completed', {
        metadata: { siteId: '1' },
        customer: 'cus_new',
        subscription: 'sub_new',
      })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'provisioned-sites',
          id: 1,
          data: expect.objectContaining({
            status: 'pending',
            stripeCustomerId: 'cus_new',
            stripeSubscriptionId: 'sub_new',
          }),
        }),
      )

      expect(mockPayload.jobs.queue).toHaveBeenCalledWith(
        expect.objectContaining({
          task: 'provision-site',
          input: { siteId: 1 },
        }),
      )
    })

    it('skips already-processed sites (idempotency)', async () => {
      const mockPayload = makePayload()
      mockPayload.findByID.mockResolvedValue(makeSite({ status: 'active' }))
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('checkout.session.completed', {
        metadata: { siteId: '1' },
        customer: 'cus_new',
        subscription: 'sub_new',
      })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mockPayload.update).not.toHaveBeenCalled()
      expect(mockPayload.jobs.queue).not.toHaveBeenCalled()
    })

    it('handles missing siteId metadata gracefully', async () => {
      const mockPayload = makePayload()
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('checkout.session.completed', {
        metadata: {},
        customer: 'cus_new',
        subscription: 'sub_new',
      })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mockPayload.update).not.toHaveBeenCalled()
    })
  })

  describe('customer.subscription.deleted', () => {
    it('suspends an active site', async () => {
      const site = makeSite({ status: 'active' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('customer.subscription.deleted', { id: 'sub_123' })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'provisioned-sites',
          id: 1,
          data: { status: 'suspended' },
        }),
      )
    })

    it('skips if site is already suspended', async () => {
      const site = makeSite({ status: 'suspended' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('customer.subscription.deleted', { id: 'sub_123' })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mockPayload.update).not.toHaveBeenCalled()
    })

    it('skips if no site found for subscription', async () => {
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [], totalDocs: 0 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('customer.subscription.deleted', { id: 'sub_unknown' })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mockPayload.update).not.toHaveBeenCalled()
    })
  })

  describe('invoice.payment_failed', () => {
    it('suspends an active site when payment fails', async () => {
      const site = makeSite({ status: 'active' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('invoice.payment_failed', {
        parent: { subscription_details: { subscription: 'sub_123' } },
      })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'suspended' },
        }),
      )
    })

    it('handles subscription as object (not string)', async () => {
      const site = makeSite({ status: 'active' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('invoice.payment_failed', {
        parent: { subscription_details: { subscription: { id: 'sub_123' } } },
      })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mockPayload.update).toHaveBeenCalled()
    })

    it('skips when subscription is missing from invoice', async () => {
      const mockPayload = makePayload()
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent('invoice.payment_failed', {
        parent: null,
      })
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(mockPayload.update).not.toHaveBeenCalled()
    })
  })

  describe('customer.subscription.updated', () => {
    function makeSubscription(overrides: Record<string, unknown> = {}) {
      return {
        id: 'sub_123',
        status: 'active',
        items: {
          data: [{ price: { id: 'price_pro' } }],
        },
        ...overrides,
      }
    }

    it('suspends site when subscription status becomes past_due', async () => {
      const site = makeSite({ status: 'active' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({ status: 'past_due' }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'suspended' },
        }),
      )
    })

    it('suspends site when subscription status becomes canceled', async () => {
      const site = makeSite({ status: 'active' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({ status: 'canceled' }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      await POST(makeRequest())
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'suspended' },
        }),
      )
    })

    it('restores suspended site when subscription becomes active', async () => {
      const site = makeSite({ status: 'suspended' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({ status: 'active' }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      await POST(makeRequest())

      // First call restores to active, second call updates plan (same plan, so no second call)
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'active' },
        }),
      )
    })

    it('updates plan and redeploys on plan change', async () => {
      const site = makeSite({ plan: 'basic', vercelProjectId: 'prj_abc' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)
      mockGetVercelProject.mockResolvedValue({ id: 'prj_abc', link: { repoId: 'repo_1' } })

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({
          status: 'active',
          items: { data: [{ price: { id: 'price_pro' } }] },
        }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      await POST(makeRequest())

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { plan: 'pro' },
        }),
      )

      expect(mockUpdateVercelEnvVars).toHaveBeenCalledWith('prj_abc', {
        SITE_PLAN: 'pro',
        NEXT_PUBLIC_SITE_PLAN: 'pro',
      })

      expect(mockTriggerVercelDeploy).toHaveBeenCalledWith('prj_abc', 'repo_1')
    })

    it('triggers media cleanup on downgrade from pro to basic', async () => {
      const site = makeSite({
        plan: 'pro',
        vercelProjectId: 'prj_abc',
        siteApiKey: 'secret-key-123',
        subdomain: 'test-site',
      })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)
      mockGetVercelProject.mockResolvedValue({ id: 'prj_abc', link: { repoId: 'repo_1' } })
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ deleted: 5 }),
      })

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({
          status: 'active',
          items: { data: [{ price: { id: 'price_basic' } }] },
        }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      await POST(makeRequest())

      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { plan: 'basic' },
        }),
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-site.glossysites.live/api/media-cleanup',
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer secret-key-123' },
        }),
      )
    })

    it('does not trigger media cleanup on upgrade from basic to pro', async () => {
      const site = makeSite({ plan: 'basic', vercelProjectId: 'prj_abc' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)
      mockGetVercelProject.mockResolvedValue({ id: 'prj_abc', link: { repoId: 'repo_1' } })

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({
          status: 'active',
          items: { data: [{ price: { id: 'price_pro' } }] },
        }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      await POST(makeRequest())

      // fetch should not be called for media cleanup (only the global mock is set)
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/media-cleanup'),
        expect.anything(),
      )
    })

    it('skips plan change when price ID is unrecognized', async () => {
      const site = makeSite({ plan: 'pro' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({
          status: 'active',
          items: { data: [{ price: { id: 'price_unknown' } }] },
        }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      await POST(makeRequest())

      // Only the status-related update (if any), not a plan change
      expect(mockUpdateVercelEnvVars).not.toHaveBeenCalled()
    })

    it('handles Vercel deploy failure gracefully', async () => {
      const site = makeSite({ plan: 'basic', vercelProjectId: 'prj_abc' })
      const mockPayload = makePayload()
      mockPayload.find.mockResolvedValue({ docs: [site], totalDocs: 1 })
      mockGetPayload.mockResolvedValue(mockPayload)
      mockUpdateVercelEnvVars.mockRejectedValue(new Error('Vercel API error'))

      const event = makeStripeEvent(
        'customer.subscription.updated',
        makeSubscription({
          status: 'active',
          items: { data: [{ price: { id: 'price_pro' } }] },
        }),
      )
      mockGetStripe.mockReturnValue({
        webhooks: { constructEvent: () => event },
      })

      // Should not throw — error is caught and logged
      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      // Plan should still be updated in DB even if Vercel fails
      expect(mockPayload.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { plan: 'pro' },
        }),
      )
    })
  })
})
