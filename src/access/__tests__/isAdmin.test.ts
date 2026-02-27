import { describe, it, expect } from 'vitest'
import { isAdmin } from '../isAdmin'

describe('isAdmin', () => {
  it('returns true when user has admin role', () => {
    const result = isAdmin({
      req: { user: { id: 1, email: 'admin@test.com', role: 'admin' } },
    } as any)

    expect(result).toBe(true)
  })

  it('returns false when user has viewer role', () => {
    const result = isAdmin({
      req: { user: { id: 2, email: 'viewer@test.com', role: 'viewer' } },
    } as any)

    expect(result).toBe(false)
  })

  it('returns false when user is null', () => {
    const result = isAdmin({
      req: { user: null },
    } as any)

    expect(result).toBe(false)
  })

  it('returns false when user is undefined', () => {
    const result = isAdmin({
      req: { user: undefined },
    } as any)

    expect(result).toBe(false)
  })

  it('returns false when user has no role', () => {
    const result = isAdmin({
      req: { user: { id: 3, email: 'norole@test.com' } },
    } as any)

    expect(result).toBe(false)
  })
})
