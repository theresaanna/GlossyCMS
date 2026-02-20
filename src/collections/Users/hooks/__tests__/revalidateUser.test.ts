import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateUser } from '../revalidateUser'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'

function makeReq(disableRevalidate = false) {
  return {
    payload: { logger: { info: vi.fn() } },
    context: disableRevalidate ? { disableRevalidate: true } : {},
  }
}

describe('revalidateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates site-owner cache tag on change', () => {
    revalidateUser({ doc: {}, req: makeReq() } as any)

    expect(revalidateTag).toHaveBeenCalledWith('site-owner', 'max')
  })

  it('logs a message when revalidating', () => {
    const req = makeReq()
    revalidateUser({ doc: {}, req } as any)

    expect(req.payload.logger.info).toHaveBeenCalledWith('Revalidating site-owner')
  })

  it('returns the doc', () => {
    const doc = { id: 1, name: 'Test User', siteTitle: 'My Site' }
    const result = revalidateUser({ doc, req: makeReq() } as any)

    expect(result).toBe(doc)
  })

  it('skips revalidation when disableRevalidate is true', () => {
    revalidateUser({ doc: {}, req: makeReq(true) } as any)

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('does not log when disableRevalidate is true', () => {
    const req = makeReq(true)
    revalidateUser({ doc: {}, req } as any)

    expect(req.payload.logger.info).not.toHaveBeenCalled()
  })
})
