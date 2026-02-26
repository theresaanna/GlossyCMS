import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from '../CommentForm'

const mockSubmitComment = vi.fn()

vi.mock('@/app/(frontend)/posts/[slug]/actions', () => ({
  submitComment: (...args: any[]) => mockSubmitComment(...args),
}))

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSubmitComment.mockResolvedValue({ success: true, message: 'Comment submitted!' })
  })

  it('renders name, email, and body fields', () => {
    render(<CommentForm postId="post-1" />)

    expect(screen.getByPlaceholderText('Your name')).toBeDefined()
    expect(screen.getByPlaceholderText('your@email.com')).toBeDefined()
    expect(screen.getByPlaceholderText('Write your comment...')).toBeDefined()
  })

  it('renders "Post Comment" button for root comments', () => {
    render(<CommentForm postId="post-1" />)

    expect(screen.getByRole('button', { name: 'Post Comment' })).toBeDefined()
  })

  it('renders "Reply" button when parentId is provided', () => {
    render(<CommentForm postId="post-1" parentId="comment-1" />)

    expect(screen.getByRole('button', { name: 'Reply' })).toBeDefined()
  })

  it('loads saved name and email from localStorage', () => {
    localStorage.setItem('commentAuthorName', 'Saved Name')
    localStorage.setItem('commentAuthorEmail', 'saved@email.com')

    render(<CommentForm postId="post-1" />)

    expect(screen.getByDisplayValue('Saved Name')).toBeDefined()
    expect(screen.getByDisplayValue('saved@email.com')).toBeDefined()
  })

  it('submits form data and shows success message', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Write your comment...'), 'Hello world')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    await waitFor(() => {
      expect(mockSubmitComment).toHaveBeenCalledTimes(1)
    })

    // Check that FormData was passed with correct values
    const formData = mockSubmitComment.mock.calls[0][0] as FormData
    expect(formData.get('authorName')).toBe('Alice')
    expect(formData.get('authorEmail')).toBe('alice@test.com')
    expect(formData.get('body')).toBe('Hello world')
    expect(formData.get('postId')).toBe('post-1')

    expect(screen.getByText('Comment submitted!')).toBeDefined()
  })

  it('includes parentId in form data when provided', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" parentId="parent-1" />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Write your comment...'), 'A reply')
    await user.click(screen.getByRole('button', { name: 'Reply' }))

    await waitFor(() => {
      expect(mockSubmitComment).toHaveBeenCalledTimes(1)
    })

    const formData = mockSubmitComment.mock.calls[0][0] as FormData
    expect(formData.get('parentId')).toBe('parent-1')
  })

  it('saves name and email to localStorage on success', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Write your comment...'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    await waitFor(() => {
      expect(localStorage.getItem('commentAuthorName')).toBe('Alice')
      expect(localStorage.getItem('commentAuthorEmail')).toBe('alice@test.com')
    })
  })

  it('clears body field on success', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    const bodyInput = screen.getByPlaceholderText('Write your comment...')
    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(bodyInput, 'My comment')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    await waitFor(() => {
      expect((bodyInput as HTMLTextAreaElement).value).toBe('')
    })
  })

  it('calls onSuccess callback after successful submission', async () => {
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" onSuccess={onSuccess} />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Write your comment...'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows error message on failed submission', async () => {
    mockSubmitComment.mockResolvedValue({ success: false, message: 'Something went wrong' })
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Write your comment...'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeDefined()
    })
  })

  it('disables submit button while submitting', async () => {
    let resolveSubmit: (value: any) => void
    mockSubmitComment.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve
      }),
    )

    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.type(screen.getByPlaceholderText('Write your comment...'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Post Comment' }))

    // Button should show "Submitting..." while waiting
    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeDefined()
    })

    // Resolve the promise
    resolveSubmit!({ success: true, message: 'Done' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Post Comment' })).toBeDefined()
    })
  })
})
