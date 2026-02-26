import { test, expect } from '@playwright/test'
import { POSTS, BASE_URL, getPostIdBySlug } from './helpers'

let postId: number
let approvedCommentId: number
let authToken: string | null = null
let authUserId: number | null = null

const COMMENT_BODY = `E2E test approved comment ${Date.now()}`

test.describe('Comments', () => {
  test.beforeAll(async () => {
    // Get the post ID for the test post
    postId = await getPostIdBySlug(POSTS.digitalHorizons.slug)

    // Try to create an approved comment.
    // First, try to register a first user (works if users table is empty).
    try {
      const registerRes = await fetch(`${BASE_URL}/api/users/first-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'e2e-test@example.com',
          password: 'test-password-123',
        }),
      })

      if (registerRes.ok) {
        const data = await registerRes.json()
        authToken = data.token
        authUserId = data.user.id
      }
    } catch {
      // first-register may not be available; try login
    }

    // If first-register didn't work, try logging in
    if (!authToken) {
      try {
        const loginRes = await fetch(`${BASE_URL}/api/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'e2e-test@example.com',
            password: 'test-password-123',
          }),
        })

        if (loginRes.ok) {
          const data = await loginRes.json()
          authToken = data.token
          authUserId = data.user.id
        }
      } catch {
        // login failed too
      }
    }

    // Create an approved comment (with auth if available, without if not)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authToken) {
      headers['Authorization'] = `JWT ${authToken}`
    }

    const commentRes = await fetch(`${BASE_URL}/api/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        authorName: 'Approved Commenter',
        authorEmail: 'approved@example.com',
        body: COMMENT_BODY,
        post: postId,
        status: 'approved',
      }),
    })

    if (commentRes.ok) {
      const data = await commentRes.json()
      approvedCommentId = data.doc.id
    }
  })

  test.afterAll(async () => {
    // Clean up the approved comment
    if (approvedCommentId) {
      const headers: Record<string, string> = {}
      if (authToken) {
        headers['Authorization'] = `JWT ${authToken}`
      }

      await fetch(`${BASE_URL}/api/comments/${approvedCommentId}`, {
        method: 'DELETE',
        headers,
      }).catch(() => {})
    }
  })

  test('approved comment is visible on the post page', async ({ page }) => {
    test.skip(!approvedCommentId, 'Could not create approved comment in setup')

    await page.goto(POSTS.digitalHorizons.url)

    // Comment count should appear in heading
    await expect(page.getByText(/Comments \(\d+\)/)).toBeVisible()

    // The approved comment body and author name should be visible
    await expect(page.getByText(COMMENT_BODY)).toBeVisible()
    await expect(page.getByText('Approved Commenter')).toBeVisible()
  })

  test('comment form prevents empty submission', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    // Click submit without filling any fields
    await page.getByRole('button', { name: 'Post Comment' }).click()

    // The form should still be visible (HTML5 validation prevents submission)
    await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible()

    // No success/error message should appear
    await expect(page.getByText('Your comment has been submitted')).not.toBeVisible()
    await expect(page.getByText('Your comment has been posted')).not.toBeVisible()
  })

  test('submitting a comment shows moderation message', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    const uniqueComment = `E2E test comment ${Date.now()}`

    await page.getByPlaceholder('Your name').fill('Test Commenter')
    await page.getByPlaceholder('your@email.com').fill('test-commenter@example.com')
    await page.getByPlaceholder('Write your comment...').fill(uniqueComment)
    await page.getByRole('button', { name: 'Post Comment' }).click()

    // Since moderateComments defaults to true, comment goes to pending
    await expect(
      page.getByText('Your comment has been submitted and is awaiting moderation.'),
    ).toBeVisible({ timeout: 10000 })
  })

  test('body field clears after successful submission but name/email retained', async ({
    page,
  }) => {
    await page.goto(POSTS.digitalHorizons.url)

    const nameInput = page.getByPlaceholder('Your name')
    const emailInput = page.getByPlaceholder('your@email.com')
    const bodyInput = page.getByPlaceholder('Write your comment...')

    await nameInput.fill('Persistent User')
    await emailInput.fill('persist@example.com')
    await bodyInput.fill(`Test body ${Date.now()}`)
    await page.getByRole('button', { name: 'Post Comment' }).click()

    // Wait for submission to complete
    await expect(page.getByText(/Your comment has been/)).toBeVisible({ timeout: 10000 })

    // Body should be cleared
    await expect(bodyInput).toHaveValue('')

    // Name and email should be retained
    await expect(nameInput).toHaveValue('Persistent User')
    await expect(emailInput).toHaveValue('persist@example.com')
  })

  test('reply button opens nested reply form', async ({ page }) => {
    test.skip(!approvedCommentId, 'Could not create approved comment in setup')

    await page.goto(POSTS.digitalHorizons.url)

    // Find the Reply button for the approved comment
    const replyButton = page.getByRole('button', { name: 'Reply' }).first()
    await expect(replyButton).toBeVisible()
    await replyButton.click()

    // A nested form should appear with name, email, comment fields and a "Reply" submit button
    // The nested form has a different parentId, so there should now be two sets of form fields
    const replyForms = page.getByRole('button', { name: 'Reply' })
    // After clicking, the "Reply" text changes or a new Reply submit button appears in the form
    await expect(page.getByPlaceholder('Your name').nth(1)).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com').nth(1)).toBeVisible()
    await expect(page.getByPlaceholder('Write your comment...').nth(1)).toBeVisible()
  })
})
