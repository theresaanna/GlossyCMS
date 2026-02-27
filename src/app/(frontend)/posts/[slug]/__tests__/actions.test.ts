import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindByID = vi.fn()
const mockFind = vi.fn()
const mockCreate = vi.fn()
const mockSendEmail = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: (...args: any[]) => mockFindByID(...args),
    find: (...args: any[]) => mockFind(...args),
    create: (...args: any[]) => mockCreate(...args),
    sendEmail: (...args: any[]) => mockSendEmail(...args),
    logger: { info: vi.fn(), error: vi.fn() },
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

vi.mock('@/utilities/getURL', () => ({
  getServerSideURL: () => 'http://localhost:3000',
}))

import { submitComment, requestCommentVerification } from '../actions'

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
    mockFindByID.mockReset()
    mockFind.mockReset()
    mockCreate.mockReset()
    mockSendEmail.mockReset()
    mockFindByID.mockResolvedValue({ id: 1, slug: 'test-post', enableComments: true })
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

  it('rejects when email is not verified', async () => {
    mockFind.mockResolvedValueOnce({ totalDocs: 0, docs: [] })

    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: false,
      message: 'Please verify your email address before posting a comment.',
    })
  })

  it('rejects when post is not found', async () => {
    mockFind.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })
    mockFindByID.mockReset()
    mockFindByID.mockRejectedValueOnce(new Error('Not found'))

    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({ success: false, message: 'Post not found.' })
  })

  it('rejects when comments are disabled on post', async () => {
    mockFind.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })
    mockFindByID.mockReset()
    mockFindByID.mockResolvedValueOnce({ id: 1, slug: 'test', enableComments: false })

    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: false,
      message: 'Comments are disabled on this post.',
    })
  })

  it('rejects when rate limited (5+ recent comments)', async () => {
    mockFind
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] }) // verified token
      .mockResolvedValueOnce({ totalDocs: 5 }) // rate limit exceeded

    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: false,
      message: 'Too many comments. Please wait a few minutes.',
    })
  })

  it('creates comment successfully and returns moderation message', async () => {
    mockFind
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] }) // verified token
      .mockResolvedValueOnce({ totalDocs: 0 }) // rate limit OK

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
    mockFind
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })
      .mockResolvedValueOnce({ totalDocs: 0 })
    mockCreate.mockReset()
    mockCreate.mockResolvedValueOnce({ id: 100, status: 'approved' })

    const result = await submitComment(makeFormData(validData))
    expect(result).toEqual({
      success: true,
      message: 'Your comment has been posted!',
    })
  })

  it('rejects reply when parent comment not found', async () => {
    mockFind
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })
      .mockResolvedValueOnce({ totalDocs: 0 })
    mockFindByID.mockReset()
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
    mockFind
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })
      .mockResolvedValueOnce({ totalDocs: 0 })
    mockFindByID.mockReset()
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
    mockFind
      .mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })
      .mockResolvedValueOnce({ totalDocs: 0 })
    mockFindByID.mockReset()
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

describe('requestCommentVerification', () => {
  beforeEach(() => {
    mockFindByID.mockReset()
    mockFind.mockReset()
    mockCreate.mockReset()
    mockSendEmail.mockReset()
    mockSendEmail.mockResolvedValue(undefined)
    mockCreate.mockResolvedValue({ id: 1 })
  })

  it('rejects when email is empty', async () => {
    const result = await requestCommentVerification('')
    expect(result).toEqual({
      success: false,
      message: 'Email is required.',
    })
  })

  it('rejects invalid email format', async () => {
    const result = await requestCommentVerification('not-valid')
    expect(result).toEqual({
      success: false,
      message: 'Please enter a valid email address.',
    })
  })

  it('returns already verified when a valid verified token exists', async () => {
    mockFind.mockResolvedValueOnce({ totalDocs: 1, docs: [{ id: 1 }] })

    const result = await requestCommentVerification('test@example.com')
    expect(result).toEqual({
      success: true,
      message: 'Your email is already verified.',
    })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('sends verification email for new email', async () => {
    mockFind
      .mockResolvedValueOnce({ totalDocs: 0, docs: [] }) // no existing verified token
      .mockResolvedValueOnce({ totalDocs: 0 }) // rate limit OK

    const result = await requestCommentVerification('test@example.com')
    expect(result).toEqual({
      success: true,
      message: 'Verification email sent! Please check your inbox and click the link.',
    })
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Verify your email to post a comment',
      }),
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'comment-verification-tokens',
        data: expect.objectContaining({
          email: 'test@example.com',
          verified: false,
        }),
      }),
    )
  })

  it('rate limits verification requests', async () => {
    mockFind
      .mockResolvedValueOnce({ totalDocs: 0, docs: [] }) // no verified token
      .mockResolvedValueOnce({ totalDocs: 3 }) // 3 recent tokens = rate limited

    const result = await requestCommentVerification('test@example.com')
    expect(result).toEqual({
      success: false,
      message: 'Too many verification requests. Please wait a few minutes.',
    })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns error when email sending fails', async () => {
    mockFind
      .mockResolvedValueOnce({ totalDocs: 0, docs: [] }) // no verified token
      .mockResolvedValueOnce({ totalDocs: 0 }) // rate limit OK
    mockSendEmail.mockReset()
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP error'))

    const result = await requestCommentVerification('test@example.com')
    expect(result).toEqual({
      success: false,
      message: 'Failed to send verification email. Please try again.',
    })
  })
})
