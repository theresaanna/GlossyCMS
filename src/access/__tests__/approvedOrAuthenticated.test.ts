import { describe, it, expect } from 'vitest'
import { approvedOrAuthenticated } from '../approvedOrAuthenticated'

describe('approvedOrAuthenticated', () => {
  it('returns true when user is authenticated', () => {
    const result = approvedOrAuthenticated({
      req: { user: { id: 1, email: 'test@test.com' } },
    } as any)

    expect(result).toBe(true)
  })

  it('returns a where clause filtering by approved status when no user', () => {
    const result = approvedOrAuthenticated({
      req: { user: null },
    } as any)

    expect(result).toEqual({
      status: {
        equals: 'approved',
      },
    })
  })

  it('returns a where clause when user is undefined', () => {
    const result = approvedOrAuthenticated({
      req: { user: undefined },
    } as any)

    expect(result).toEqual({
      status: {
        equals: 'approved',
      },
    })
  })
})
