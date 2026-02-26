import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePage, revalidateDelete } from '../revalidatePage'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

import { revalidatePath, revalidateTag } from 'next/cache'

function makePayload() {
  return { logger: { info: vi.fn() } }
}

describe('revalidatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates path when page is published', () => {
    const doc = { _status: 'published', slug: 'about' } as any
    const previousDoc = { _status: 'draft' } as any

    const result = revalidatePage({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/about')
    expect(revalidateTag).toHaveBeenCalledWith('pages-sitemap', 'max')
    expect(result).toBe(doc)
  })

  it('revalidates "/" for the home page slug', () => {
    const doc = { _status: 'published', slug: 'home' } as any
    const previousDoc = { _status: 'draft' } as any

    revalidatePage({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('revalidates old path when page is unpublished', () => {
    const doc = { _status: 'draft', slug: 'about' } as any
    const previousDoc = { _status: 'published', slug: 'about' } as any

    revalidatePage({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/about')
    expect(revalidateTag).toHaveBeenCalledWith('pages-sitemap', 'max')
  })

  it('revalidates "/" when home page is unpublished', () => {
    const doc = { _status: 'draft', slug: 'home' } as any
    const previousDoc = { _status: 'published', slug: 'home' } as any

    revalidatePage({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('does not revalidate when disableRevalidate is set', () => {
    const doc = { _status: 'published', slug: 'about' } as any
    const previousDoc = { _status: 'draft' } as any

    revalidatePage({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: { disableRevalidate: true } },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('does not revalidate when status unchanged and not published', () => {
    const doc = { _status: 'draft', slug: 'about' } as any
    const previousDoc = { _status: 'draft' } as any

    revalidatePage({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('revalidateDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates path and sitemap when page is deleted', () => {
    const doc = { slug: 'about' } as any

    const result = revalidateDelete({
      doc,
      req: { context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/about')
    expect(revalidateTag).toHaveBeenCalledWith('pages-sitemap', 'max')
    expect(result).toBe(doc)
  })

  it('revalidates "/" when home page is deleted', () => {
    const doc = { slug: 'home' } as any

    revalidateDelete({
      doc,
      req: { context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })

  it('skips revalidation when disableRevalidate is set', () => {
    const doc = { slug: 'about' } as any

    revalidateDelete({
      doc,
      req: { context: { disableRevalidate: true } },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
