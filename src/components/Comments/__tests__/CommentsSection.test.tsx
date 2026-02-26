import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock payload with default export for @payload-config
const mockFind = vi.fn()

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    find: (...args: any[]) => mockFind(...args),
  }),
}))

// Mock child components to avoid pulling in full dependency tree
vi.mock('../CommentThread', () => ({
  CommentThread: ({ comment, postId }: any) => (
    <div data-testid="comment-thread">
      {comment.authorName}: {comment.body} (post: {postId})
    </div>
  ),
}))

vi.mock('../CommentForm', () => ({
  CommentForm: ({ postId }: any) => (
    <div data-testid="comment-form">Form for {postId}</div>
  ),
}))

import { render, screen } from '@testing-library/react'
import { CommentsSection } from '../index'

describe('CommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Leave a Comment" when there are no comments', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    const Component = await CommentsSection({ postId: 'post-1' })
    render(Component as any)

    expect(screen.getByText('Leave a Comment')).toBeDefined()
  })

  it('renders comment count when comments exist', async () => {
    mockFind.mockResolvedValue({
      docs: [
        { id: '1', authorName: 'Alice', body: 'Hello', createdAt: '2026-01-01', parent: null },
        { id: '2', authorName: 'Bob', body: 'World', createdAt: '2026-01-02', parent: null },
      ],
    })

    const Component = await CommentsSection({ postId: 'post-1' })
    render(Component as any)

    expect(screen.getByText('Comments (2)')).toBeDefined()
  })

  it('renders CommentThread for each root comment', async () => {
    mockFind.mockResolvedValue({
      docs: [
        { id: '1', authorName: 'Alice', body: 'Hello', createdAt: '2026-01-01', parent: null },
      ],
    })

    const Component = await CommentsSection({ postId: 'post-1' })
    render(Component as any)

    expect(screen.getByTestId('comment-thread')).toBeDefined()
  })

  it('renders CommentForm with the correct postId', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    const Component = await CommentsSection({ postId: 'post-42' })
    render(Component as any)

    expect(screen.getByText('Form for post-42')).toBeDefined()
  })

  it('queries comments sorted by createdAt with correct filters', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    await CommentsSection({ postId: 'post-1' })

    expect(mockFind).toHaveBeenCalledWith({
      collection: 'comments',
      where: { post: { equals: 'post-1' } },
      sort: 'createdAt',
      limit: 500,
      overrideAccess: false,
      depth: 0,
    })
  })
})
