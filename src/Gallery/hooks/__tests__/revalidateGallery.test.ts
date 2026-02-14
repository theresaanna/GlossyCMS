import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateGallery } from '../revalidateGallery'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { revalidateTag, revalidatePath } from 'next/cache'

function makeReq(disableRevalidate = false) {
  return {
    payload: { logger: { info: vi.fn() } },
    context: disableRevalidate ? { disableRevalidate: true } : {},
  }
}

describe('revalidateGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates gallery-settings cache tag on change', () => {
    revalidateGallery({ doc: {}, req: makeReq() } as any)

    expect(revalidateTag).toHaveBeenCalledWith('global_gallery-settings', 'max')
  })

  it('revalidates /gallery path on change', () => {
    revalidateGallery({ doc: {}, req: makeReq() } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/gallery')
  })

  it('returns the doc', () => {
    const doc = { id: 1, title: 'Gallery' }
    const result = revalidateGallery({ doc, req: makeReq() } as any)

    expect(result).toBe(doc)
  })

  it('skips revalidation when disableRevalidate is true', () => {
    revalidateGallery({ doc: {}, req: makeReq(true) } as any)

    expect(revalidateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
