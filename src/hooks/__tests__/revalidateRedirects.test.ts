import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateRedirects } from '../revalidateRedirects'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'

describe('revalidateRedirects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates redirects tag', () => {
    const doc = { id: 1 } as any

    const result = revalidateRedirects({
      doc,
      req: { payload: { logger: { info: vi.fn() } } },
    } as any)

    expect(revalidateTag).toHaveBeenCalledWith('redirects', 'max')
    expect(result).toBe(doc)
  })

  it('logs the revalidation', () => {
    const logger = { info: vi.fn() }
    const doc = { id: 1 } as any

    revalidateRedirects({
      doc,
      req: { payload: { logger } },
    } as any)

    expect(logger.info).toHaveBeenCalledWith('Revalidating redirects')
  })
})
