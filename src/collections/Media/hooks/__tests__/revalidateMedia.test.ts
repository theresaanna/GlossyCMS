import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateMedia, revalidateMediaDelete } from '../revalidateMedia'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

function makeReq(disableRevalidate = false) {
  return {
    payload: { logger: { info: vi.fn() } },
    context: disableRevalidate ? { disableRevalidate: true } : {},
  }
}

describe('revalidateMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates /gallery on media change', () => {
    revalidateMedia({ req: makeReq() } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/gallery')
  })

  it('skips revalidation when disableRevalidate is true', () => {
    revalidateMedia({ req: makeReq(true) } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('revalidateMediaDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates /gallery on media delete', () => {
    revalidateMediaDelete({ req: makeReq() } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/gallery')
  })

  it('skips revalidation when disableRevalidate is true', () => {
    revalidateMediaDelete({ req: makeReq(true) } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
