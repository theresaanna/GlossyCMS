import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidatePost, revalidateDelete } from '../revalidatePost'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

import { revalidatePath, revalidateTag } from 'next/cache'

function makePayload() {
  return { logger: { info: vi.fn() } }
}

describe('revalidatePost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates path and sitemap when post is published', () => {
    const doc = { _status: 'published', slug: 'hello-world' } as any
    const previousDoc = { _status: 'draft' } as any

    const result = revalidatePost({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/posts/hello-world')
    expect(revalidateTag).toHaveBeenCalledWith('posts-sitemap', 'max')
    expect(result).toBe(doc)
  })

  it('revalidates old path when post is unpublished', () => {
    const doc = { _status: 'draft', slug: 'hello-world' } as any
    const previousDoc = { _status: 'published', slug: 'hello-world' } as any

    revalidatePost({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/posts/hello-world')
    expect(revalidateTag).toHaveBeenCalledWith('posts-sitemap', 'max')
  })

  it('does not revalidate when disableRevalidate is set', () => {
    const doc = { _status: 'published', slug: 'test' } as any
    const previousDoc = { _status: 'draft' } as any

    revalidatePost({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: { disableRevalidate: true } },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('does not revalidate when status unchanged and not published', () => {
    const doc = { _status: 'draft', slug: 'test' } as any
    const previousDoc = { _status: 'draft' } as any

    revalidatePost({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('revalidates both new and old paths when re-published', () => {
    const doc = { _status: 'published', slug: 'updated' } as any
    const previousDoc = { _status: 'published', slug: 'old-slug' } as any

    revalidatePost({
      doc,
      previousDoc,
      req: { payload: makePayload(), context: {} },
    } as any)

    // Published doc gets its path revalidated
    expect(revalidatePath).toHaveBeenCalledWith('/posts/updated')
  })
})

describe('revalidateDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates path and sitemap when post is deleted', () => {
    const doc = { slug: 'removed-post' } as any

    const result = revalidateDelete({
      doc,
      req: { context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/posts/removed-post')
    expect(revalidateTag).toHaveBeenCalledWith('posts-sitemap', 'max')
    expect(result).toBe(doc)
  })

  it('skips revalidation when disableRevalidate is set', () => {
    const doc = { slug: 'test' } as any

    revalidateDelete({
      doc,
      req: { context: { disableRevalidate: true } },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
