import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindByID = vi.fn()
const mockFind = vi.fn()
const mockCreate = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: (...args: any[]) => mockFindByID(...args),
    find: (...args: any[]) => mockFind(...args),
    create: (...args: any[]) => mockCreate(...args),
  }),
}))

vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: (name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1'
      return null
    },
  }),
}))

import { submitComment } from '../actions'

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    fd.set(key, value)
  }
  return fd
}

const validData = {
  authorName: 'Alice',
  authorEmail: 'alice@example.com',
  body: 'Great post!',
  postId: '1',
}

describe('submitComment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindByID.mockResolvedValue({ id: 1, slug: 'test-post', enableComments: true })
    mockFind.mockResolvedValue({ totalDocs: 0 })
    mockCreate.mockResolvedValue({ id: 100, status: 'pending' })
  })

  it('rejects when name is missing', async () => {
    const result = await submitComment(makeFormData({ ...validData, authorName: '' }))
    expect(result).toEqual({
      success: false,
      message: 'Name, email, and comment are required.',
    })
  })

  it('rejects when email is missing', async () => {
    const result = await submitComment(makeFormData({ ...validData, authorEmail: '' }))
    expect(result).toEqual({
      success: false,
      message: 'Name, email, and comment are required.',
    })
  })

  it('rejects when body is missing', async () => {
    const result = await submitComment(makeFormData({ ...validData, body: '' }))
    expect(result).toEqual({
      success: false,
      message: 'Name, email, and comment are required.',
    })
  })

  it('rejects when body exceeds 5000 characters', async () => {
    const result = await submitComment(
      makeFormData({ ...validData, body: 'a'.repeat(5001) }),
    )
    expect(result).toEqual({
      success: false,
      message: 'Comment must be under 5000 characters.',
    })
  })

  it('rejects invalid email address', async () => {
    const result = await submitComment(
      makeFormData({ ...validData, authorEmail: 'not-an-email' }),
    )
    expect(result).toEqual({
      success: false,
      message: 'Please enter a valid email address.',
    })
  })

  it('rejects when postId is missing', async () => {
    const { postId, ...rest } = validData
    const result = await submitComment(makeFormData(rest))
    expect(result).toEqual({ success: false, message: 'Post not found.' })
  })

  it('rejects when postId is not numeric', async () => {
    const result = await submitComment(makeFormData({ ...validData, postId: 'abc' }))
    expect(result).toEqual({ success: false, message: 'Post not found.' })
  })

  it('rejects when post is not found', async () => {
    mockFindByID.mockRejectedValueOnce(new Error('Not found'))
    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({ success: false, message: 'Post not found.' })
  })

  it('rejects when comments are disabled on post', async () => {
    mockFindByID.mockResolvedValueOnce({ id: 1, slug: 'test', enableComments: false })
    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: false,
      message: 'Comments are disabled on this post.',
    })
  })

  it('rejects when rate limited (5+ recent comments)', async () => {
    mockFind.mockResolvedValueOnce({ totalDocs: 5 })
    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: false,
      message: 'Too many comments. Please wait a few minutes.',
    })
  })

  it('creates comment successfully and returns moderation message', async () => {
    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: true,
      message: 'Your comment has been submitted and is awaiting moderation.',
    })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'comments',
        data: expect.objectContaining({
          authorName: 'Alice',
          authorEmail: 'alice@example.com',
          body: 'Great post!',
          post: 1,
        }),
      }),
    )
  })

  it('returns posted message when comment is auto-approved', async () => {
    mockCreate.mockResolvedValueOnce({ id: 100, status: 'approved' })
    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: true,
      message: 'Your comment has been posted!',
    })
  })

  it('rejects reply when parent comment not found', async () => {
    // First call returns the post, second call (for parent comment) throws
    mockFindByID
      .mockResolvedValueOnce({ id: 1, slug: 'test-post', enableComments: true })
      .mockRejectedValueOnce(new Error('Not found'))

    const result = await submitComment(
      makeFormData({ ...validData, parentId: '999' }),
    )
    expect(result).toEqual({
      success: false,
      message: 'Parent comment not found.',
    })
  })

  it('rejects reply when parent belongs to different post', async () => {
    mockFindByID
      .mockResolvedValueOnce({ id: 1, slug: 'test-post', enableComments: true })
      .mockResolvedValueOnce({ id: 5, post: 999, depth: 0 })

    const result = await submitComment(
      makeFormData({ ...validData, parentId: '5' }),
    )
    expect(result).toEqual({
      success: false,
      message: 'Invalid reply target.',
    })
  })

  it('rejects reply when max depth reached', async () => {
    mockFindByID
      .mockResolvedValueOnce({ id: 1, slug: 'test-post', enableComments: true })
      .mockResolvedValueOnce({ id: 5, post: 1, depth: 3 })

    const result = await submitComment(
      makeFormData({ ...validData, parentId: '5' }),
    )
    expect(result).toEqual({
      success: false,
      message: 'Maximum reply depth reached.',
    })
  })
})
