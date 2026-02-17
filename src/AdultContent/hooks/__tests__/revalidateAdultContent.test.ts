import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateAdultContent } from '../revalidateAdultContent'

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

describe('revalidateAdultContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates adult-content cache tag on change', () => {
    revalidateAdultContent({ doc: {}, req: makeReq() } as any)

    expect(revalidateTag).toHaveBeenCalledWith('global_adult-content')
  })

  it('logs a message when revalidating', () => {
    const req = makeReq()
    revalidateAdultContent({ doc: {}, req } as any)

    expect(req.payload.logger.info).toHaveBeenCalledWith(
      'Revalidating adult content settings',
    )
  })

  it('returns the doc', () => {
    const doc = { id: 1, enableAgeVerification: true, minimumAge: 18 }
    const result = revalidateAdultContent({ doc, req: makeReq() } as any)

    expect(result).toBe(doc)
  })

  it('skips revalidation when disableRevalidate is true', () => {
    revalidateAdultContent({ doc: {}, req: makeReq(true) } as any)

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('does not log when disableRevalidate is true', () => {
    const req = makeReq(true)
    revalidateAdultContent({ doc: {}, req } as any)

    expect(req.payload.logger.info).not.toHaveBeenCalled()
  })
})
