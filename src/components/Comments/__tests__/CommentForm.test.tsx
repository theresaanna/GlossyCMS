import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentForm } from '../CommentForm'

const mockSubmitComment = vi.fn()
const mockRequestCommentVerification = vi.fn()

vi.mock('@/app/(frontend)/posts/[slug]/actions', () => ({
  submitComment: (...args: any[]) => mockSubmitComment(...args),
  requestCommentVerification: (...args: any[]) => mockRequestCommentVerification(...args),
}))

/**
 * Helper: simulate the verify flow so the submit button becomes enabled.
 * Enters email, clicks Verify, and waits for the "✓ Verified" badge.
 */
async function verifyEmail(user: ReturnType<typeof userEvent.setup>, email = 'alice@test.com') {
  await user.type(screen.getByPlaceholderText('your@email.com'), email)
  await user.click(screen.getByRole('button', { name: 'Verify' }))
  await waitFor(() => {
    expect(screen.getByText('✓ Verified')).toBeDefined()
  })
}

describe('CommentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSubmitComment.mockResolvedValue({ success: true, message: 'Comment submitted!' })
    // Default: verification returns "already verified" to fast-track tests
    mockRequestCommentVerification.mockResolvedValue({
      success: true,
      message: 'Your email is already verified.',
    })
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

  it('renders a Verify button next to the email field', () => {
    render(<CommentForm postId="post-1" />)

    expect(screen.getByRole('button', { name: 'Verify' })).toBeDefined()
  })

  it('submit button is disabled before email is verified', () => {
    render(<CommentForm postId="post-1" />)

    const submitButton = screen.getByRole('button', { name: 'Post Comment' })
    expect(submitButton).toHaveProperty('disabled', true)
  })

  it('shows verification hint when email is not verified', () => {
    render(<CommentForm postId="post-1" />)

    expect(screen.getByText('You must verify your email before posting a comment.')).toBeDefined()
  })

  it('loads saved name and email from localStorage', () => {
    localStorage.setItem('commentAuthorName', 'Saved Name')
    localStorage.setItem('commentAuthorEmail', 'saved@email.com')

    render(<CommentForm postId="post-1" />)

    expect(screen.getByDisplayValue('Saved Name')).toBeDefined()
    expect(screen.getByDisplayValue('saved@email.com')).toBeDefined()
  })

  it('clicking Verify without email shows error', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.click(screen.getByRole('button', { name: 'Verify' }))

    await waitFor(() => {
      expect(screen.getByText('Please enter your email address first.')).toBeDefined()
    })
  })

  it('clicking Verify sends verification request', async () => {
    mockRequestCommentVerification.mockResolvedValue({
      success: true,
      message: 'Verification email sent! Please check your inbox and click the link.',
    })

    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.click(screen.getByRole('button', { name: 'Verify' }))

    await waitFor(() => {
      expect(mockRequestCommentVerification).toHaveBeenCalledWith('alice@test.com')
    })

    expect(
      screen.getByText('Verification email sent! Please check your inbox and click the link.'),
    ).toBeDefined()
  })

  it('shows verified badge and enables submit after email is already verified', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await verifyEmail(user)

    // Submit button should now be enabled
    const submitButton = screen.getByRole('button', { name: 'Post Comment' })
    expect(submitButton).toHaveProperty('disabled', false)
  })

  it('shows "I\'ve verified" button after verification email is sent', async () => {
    mockRequestCommentVerification.mockResolvedValue({
      success: true,
      message: 'Verification email sent! Please check your inbox and click the link.',
    })

    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('your@email.com'), 'alice@test.com')
    await user.click(screen.getByRole('button', { name: 'Verify' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: "I've verified" })).toBeDefined()
    })
  })

  it('submits form data and shows success message when email is verified', async () => {
    const user = userEvent.setup()
    render(<CommentForm postId="post-1" />)

    await user.type(screen.getByPlaceholderText('Your name'), 'Alice')
    await verifyEmail(user)
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
    await verifyEmail(user)
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
    await verifyEmail(user)
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
    await verifyEmail(user)
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
    await verifyEmail(user)
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
    await verifyEmail(user)
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
    await verifyEmail(user)
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
