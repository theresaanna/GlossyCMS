import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateSiteSettings } from '../revalidateSiteSettings'

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

describe('revalidateSiteSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates global_site-settings cache tag on change', () => {
    revalidateSiteSettings({ doc: {}, req: makeReq() } as any)

    expect(revalidateTag).toHaveBeenCalledWith('global_site-settings', 'max')
  })

  it('logs a message when revalidating', () => {
    const req = makeReq()
    revalidateSiteSettings({ doc: {}, req } as any)

    expect(req.payload.logger.info).toHaveBeenCalledWith('Revalidating site settings')
  })

  it('returns the doc', () => {
    const doc = { siteTitle: 'My Site', headerImage: 1, userImage: 2 }
    const result = revalidateSiteSettings({ doc, req: makeReq() } as any)

    expect(result).toBe(doc)
  })

  it('skips revalidation when disableRevalidate is true', () => {
    revalidateSiteSettings({ doc: {}, req: makeReq(true) } as any)

    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('does not log when disableRevalidate is true', () => {
    const req = makeReq(true)
    revalidateSiteSettings({ doc: {}, req } as any)

    expect(req.payload.logger.info).not.toHaveBeenCalled()
  })
})
