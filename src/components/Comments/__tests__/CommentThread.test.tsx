import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentThread } from '../CommentThread'
import type { CommentNode } from '../CommentThread'

// Mock CommentForm since it imports server action which pulls in Payload config
vi.mock('../CommentForm', () => ({
  CommentForm: ({ postId, parentId }: { postId: string; parentId?: string }) => (
    <div data-testid="comment-form">
      Form for post {postId}
      {parentId && ` reply to ${parentId}`}
    </div>
  ),
}))

function makeComment(overrides: Partial<CommentNode> = {}): CommentNode {
  return {
    id: '1',
    authorName: 'Alice',
    body: 'Hello world',
    depth: 0,
    createdAt: '2026-01-15T12:00:00.000Z',
    children: [],
    ...overrides,
  }
}

describe('CommentThread', () => {
  it('renders author name and body', () => {
    render(<CommentThread comment={makeComment()} postId="10" />)

    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Hello world')).toBeDefined()
  })

  it('renders formatted date', () => {
    render(<CommentThread comment={makeComment()} postId="10" />)

    // Jan 15, 2026 in en-US
    expect(screen.getByText('Jan 15, 2026')).toBeDefined()
  })

  it('shows reply button when depth is less than maxDepth', () => {
    render(<CommentThread comment={makeComment({ depth: 0 })} postId="10" maxDepth={3} />)

    expect(screen.getByText('Reply')).toBeDefined()
  })

  it('hides reply button when depth equals maxDepth', () => {
    render(<CommentThread comment={makeComment({ depth: 3 })} postId="10" maxDepth={3} />)

    expect(screen.queryByText('Reply')).toBeNull()
  })

  it('renders nested children', () => {
    const child = makeComment({ id: '2', authorName: 'Bob', body: 'Reply here', depth: 1 })
    const parent = makeComment({ children: [child] })

    render(<CommentThread comment={parent} postId="10" />)

    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Reply here')).toBeDefined()
  })

  it('applies nested indentation class for depth > 0', () => {
    const { container } = render(
      <CommentThread comment={makeComment({ depth: 1 })} postId="10" />,
    )

    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).toContain('ml-6')
    expect(outerDiv.className).toContain('border-l')
  })

  it('does not apply indentation for depth 0', () => {
    const { container } = render(
      <CommentThread comment={makeComment({ depth: 0 })} postId="10" />,
    )

    const outerDiv = container.firstElementChild as HTMLElement
    expect(outerDiv.className).not.toContain('ml-6')
  })
})
