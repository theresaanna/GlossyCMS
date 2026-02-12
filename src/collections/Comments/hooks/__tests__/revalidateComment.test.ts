import { describe, it, expect, vi, beforeEach } from 'vitest'
import { revalidateComment, revalidateCommentDelete } from '../revalidateComment'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'

function makePayload(slug: string | null = 'test-post') {
  return {
    findByID: vi.fn().mockResolvedValue(slug ? { slug } : null),
    logger: { info: vi.fn() },
  }
}

describe('revalidateComment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates when comment becomes approved', async () => {
    const payload = makePayload('my-post')
    const doc = { id: 1, status: 'approved', post: 10 } as any
    const previousDoc = { status: 'pending' } as any

    const result = await revalidateComment({
      doc,
      previousDoc,
      req: { payload, context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/posts/my-post')
    expect(result).toBe(doc)
  })

  it('revalidates when comment was previously approved', async () => {
    const payload = makePayload('my-post')
    const doc = { id: 1, status: 'pending', post: 10 } as any
    const previousDoc = { status: 'approved' } as any

    await revalidateComment({
      doc,
      previousDoc,
      req: { payload, context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/posts/my-post')
  })

  it('does not revalidate when status is not and was not approved', async () => {
    const payload = makePayload()
    const doc = { id: 1, status: 'pending', post: 10 } as any
    const previousDoc = { status: 'pending' } as any

    await revalidateComment({
      doc,
      previousDoc,
      req: { payload, context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('skips revalidation when disableRevalidate is true', async () => {
    const payload = makePayload()
    const doc = { id: 1, status: 'approved', post: 10 } as any
    const previousDoc = { status: 'pending' } as any

    const result = await revalidateComment({
      doc,
      previousDoc,
      req: { payload, context: { disableRevalidate: true } },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
    expect(result).toBe(doc)
  })

  it('handles post as an object with id', async () => {
    const payload = makePayload('slug-from-obj')
    const doc = { id: 1, status: 'approved', post: { id: 42 } } as any
    const previousDoc = { status: 'pending' } as any

    await revalidateComment({
      doc,
      previousDoc,
      req: { payload, context: {} },
    } as any)

    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, collection: 'posts' }),
    )
    expect(revalidatePath).toHaveBeenCalledWith('/posts/slug-from-obj')
  })

  it('does not revalidate when post slug cannot be found', async () => {
    const payload = makePayload(null)
    const doc = { id: 1, status: 'approved', post: 10 } as any
    const previousDoc = { status: 'pending' } as any

    await revalidateComment({
      doc,
      previousDoc,
      req: { payload, context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('revalidateCommentDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revalidates when an approved comment is deleted', async () => {
    const payload = makePayload('deleted-post')
    const doc = { id: 1, status: 'approved', post: 10 } as any

    const result = await revalidateCommentDelete({
      doc,
      req: { payload, context: {} },
    } as any)

    expect(revalidatePath).toHaveBeenCalledWith('/posts/deleted-post')
    expect(result).toBe(doc)
  })

  it('does not revalidate when a non-approved comment is deleted', async () => {
    const payload = makePayload()
    const doc = { id: 1, status: 'pending', post: 10 } as any

    await revalidateCommentDelete({
      doc,
      req: { payload, context: {} },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('skips revalidation when disableRevalidate is true', async () => {
    const payload = makePayload()
    const doc = { id: 1, status: 'approved', post: 10 } as any

    await revalidateCommentDelete({
      doc,
      req: { payload, context: { disableRevalidate: true } },
    } as any)

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
