import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateFooter } from '../revalidateFooter'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'

function makePayload() {
  return { logger: { info: vi.fn() } }
}

describe('revalidateFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates global_footer tag', () => {
    const doc = { id: 1 } as any

    const result = revalidateFooter({
      doc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidateTag).toHaveBeenCalledWith('global_footer', 'max')
    expect(result).toBe(doc)
  })

  it('skips revalidation when disableRevalidate is set', () => {
    const doc = { id: 1 } as any

    revalidateFooter({
      doc,
      req: { payload: makePayload(), context: { disableRevalidate: true } },
    } as any)

    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
