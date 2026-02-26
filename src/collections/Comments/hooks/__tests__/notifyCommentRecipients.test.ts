import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyCommentRecipients } from '../notifyCommentRecipients'

vi.mock('../../../../utilities/getURL', () => ({
  getServerSideURL: () => 'https://mysite.com',
}))

function makePayload(overrides: Record<string, any> = {}) {
  return {
    findByID: vi.fn().mockImplementation(({ collection, id }) => {
      const key = `${collection}:${id}`
      if (overrides[key]) return Promise.resolve(overrides[key])
      return Promise.reject(new Error(`Not found: ${key}`))
    }),
    sendEmail: vi.fn().mockResolvedValue(undefined),
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

function makeDoc(overrides: Partial<any> = {}) {
  return {
    id: 'comment-1',
    post: 'post-1',
    authorName: 'Commenter',
    authorEmail: 'commenter@test.com',
    body: 'This is a comment.',
    parent: null,
    ...overrides,
  }
}

describe('notifyCommentRecipients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not send emails for non-create operations', async () => {
    const payload = makePayload()
    const doc = makeDoc()

    await notifyCommentRecipients({
      doc,
      operation: 'update',
      req: { payload },
    } as any)

    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('sends notification to post author on new comment', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1'],
      },
      'users:user-1': {
        email: 'author@test.com',
      },
    })
    const doc = makeDoc()

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'author@test.com',
        subject: expect.stringContaining('New comment on "Hello World"'),
      }),
    )
  })

  it('does not notify when comment author is the same as post author', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1'],
      },
      'users:user-1': {
        email: 'commenter@test.com', // Same as comment author
      },
    })
    const doc = makeDoc({ authorEmail: 'commenter@test.com' })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('skips when post has no slug', async () => {
    const payload = makePayload({
      'posts:post-1': { slug: null, title: 'No Slug', authors: [] },
    })
    const doc = makeDoc()

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('sends reply notification to parent comment author', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: [],
      },
      'comments:parent-1': {
        authorEmail: 'parent@test.com',
      },
    })
    const doc = makeDoc({ parent: 'parent-1' })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'parent@test.com',
        subject: expect.stringContaining('replied to your comment'),
      }),
    )
  })

  it('does not send duplicate notification when parent author is also post author', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1'],
      },
      'users:user-1': {
        email: 'both@test.com',
      },
      'comments:parent-1': {
        authorEmail: 'both@test.com', // Same as post author
      },
    })
    const doc = makeDoc({ parent: 'parent-1' })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    // Should only send one email (to post author), not a second for parent comment author
    expect(payload.sendEmail).toHaveBeenCalledTimes(1)
    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'both@test.com',
        subject: expect.stringContaining('New comment'),
      }),
    )
  })

  it('does not send reply notification when replying to own comment', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: [],
      },
      'comments:parent-1': {
        authorEmail: 'commenter@test.com', // Same as comment author
      },
    })
    const doc = makeDoc({ parent: 'parent-1', authorEmail: 'commenter@test.com' })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).not.toHaveBeenCalled()
  })

  it('handles multiple post authors', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1', 'user-2'],
      },
      'users:user-1': { email: 'alice@test.com' },
      'users:user-2': { email: 'bob@test.com' },
    })
    const doc = makeDoc()

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).toHaveBeenCalledTimes(2)
  })

  it('handles post reference as an object', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: [],
      },
    })
    const doc = makeDoc({ post: { id: 'post-1' } })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'posts',
        id: 'post-1',
      }),
    )
  })

  it('handles parent comment reference as an object', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: [],
      },
      'comments:parent-1': {
        authorEmail: 'parent@test.com',
      },
    })
    const doc = makeDoc({ parent: { id: 'parent-1' } })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'comments',
        id: 'parent-1',
      }),
    )
  })

  it('includes correct comment URL in email', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1'],
      },
      'users:user-1': { email: 'author@test.com' },
    })
    const doc = makeDoc({ id: 'comment-42' })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(payload.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://mysite.com/posts/hello-world#comment-comment-42'),
      }),
    )
  })

  it('handles send email failures gracefully', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1'],
      },
      'users:user-1': { email: 'author@test.com' },
    })
    payload.sendEmail.mockRejectedValue(new Error('SMTP error'))
    const doc = makeDoc()

    // Should not throw
    const result = await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    expect(result).toBe(doc)
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it('truncates long comment bodies in email HTML', async () => {
    const payload = makePayload({
      'posts:post-1': {
        slug: 'hello-world',
        title: 'Hello World',
        authors: ['user-1'],
      },
      'users:user-1': { email: 'author@test.com' },
    })
    const longBody = 'A'.repeat(500)
    const doc = makeDoc({ body: longBody })

    await notifyCommentRecipients({
      doc,
      operation: 'create',
      req: { payload },
    } as any)

    const html = payload.sendEmail.mock.calls[0][0].html as string
    // Should contain the truncated body (300 chars + ellipsis) not the full 500
    expect(html).toContain('A'.repeat(300))
    expect(html).toContain('…')
    expect(html).not.toContain('A'.repeat(301))
  })
})
