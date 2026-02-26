import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('stripe', () => {
  const MockStripe = vi.fn().mockImplementation((key: string) => ({
    _key: key,
  }))
  return { default: MockStripe }
})

describe('getStripe', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('creates a Stripe instance with the secret key', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_12345')

    const { getStripe } = await import('../stripe')
    const instance = getStripe()

    expect(instance).toBeDefined()
    expect((instance as any)._key).toBe('sk_test_12345')
  })

  it('returns the same singleton instance on subsequent calls', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_12345')

    const { getStripe } = await import('../stripe')
    const first = getStripe()
    const second = getStripe()

    expect(first).toBe(second)
  })

  it('throws when STRIPE_SECRET_KEY is not set', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '')

    const { getStripe } = await import('../stripe')

    expect(() => getStripe()).toThrow('STRIPE_SECRET_KEY is not set.')
  })
})
