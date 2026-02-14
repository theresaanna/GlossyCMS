import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setSubscriptionDates } from '../setSubscriptionDates'

describe('setSubscriptionDates hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-14T12:00:00.000Z'))
  })

  it('sets subscribedAt on create', async () => {
    const data = { email: 'test@example.com' } as any

    const result = await setSubscriptionDates({
      data,
      operation: 'create',
      originalDoc: undefined,
    } as any)

    expect(result.subscribedAt).toBe('2026-02-14T12:00:00.000Z')
  })

  it('does not modify data on create beyond subscribedAt', async () => {
    const data = { email: 'test@example.com', name: 'Test' } as any

    const result = await setSubscriptionDates({
      data,
      operation: 'create',
      originalDoc: undefined,
    } as any)

    expect(result.email).toBe('test@example.com')
    expect(result.name).toBe('Test')
    expect(result.subscribedAt).toBeDefined()
  })

  it('sets unsubscribedAt when status changes to unsubscribed', async () => {
    const data = { status: 'unsubscribed' } as any
    const originalDoc = { status: 'subscribed' } as any

    const result = await setSubscriptionDates({
      data,
      operation: 'update',
      originalDoc,
    } as any)

    expect(result.unsubscribedAt).toBe('2026-02-14T12:00:00.000Z')
  })

  it('clears unsubscribedAt and refreshes subscribedAt when resubscribing', async () => {
    const data = { status: 'subscribed' } as any
    const originalDoc = { status: 'unsubscribed' } as any

    const result = await setSubscriptionDates({
      data,
      operation: 'update',
      originalDoc,
    } as any)

    expect(result.unsubscribedAt).toBeNull()
    expect(result.subscribedAt).toBe('2026-02-14T12:00:00.000Z')
  })

  it('does not modify dates when status has not changed', async () => {
    const data = { name: 'Updated Name' } as any
    const originalDoc = { status: 'subscribed' } as any

    const result = await setSubscriptionDates({
      data,
      operation: 'update',
      originalDoc,
    } as any)

    expect(result.subscribedAt).toBeUndefined()
    expect(result.unsubscribedAt).toBeUndefined()
  })

  it('does not modify dates when status is explicitly the same', async () => {
    const data = { status: 'subscribed', name: 'Updated' } as any
    const originalDoc = { status: 'subscribed' } as any

    const result = await setSubscriptionDates({
      data,
      operation: 'update',
      originalDoc,
    } as any)

    expect(result.subscribedAt).toBeUndefined()
    expect(result.unsubscribedAt).toBeUndefined()
  })

  vi.useRealTimers()
})
