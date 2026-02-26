export const BASE_URL = 'http://localhost:3000'

export const POSTS = {
  digitalHorizons: {
    slug: 'digital-horizons',
    title: 'Digital Horizons: A Glimpse into Tomorrow',
    url: '/posts/digital-horizons',
  },
  globalGaze: {
    slug: 'global-gaze',
    title: 'Global Gaze: Beyond the Headlines',
    url: '/posts/global-gaze',
  },
  dollarAndSense: {
    slug: 'dollar-and-sense-the-financial-forecast',
    title: 'Dollar and Sense: The Financial Forecast',
    url: '/posts/dollar-and-sense-the-financial-forecast',
  },
} as const

export const ALL_POST_TITLES = Object.values(POSTS).map((p) => p.title)

/**
 * Register the first admin user on a provisioned site (users table is empty).
 * Only works when no users exist — the first-register endpoint is locked after that.
 */
export async function registerFirstUser(): Promise<{ token: string; userId: number }> {
  const res = await fetch(`${BASE_URL}/api/users/first-register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'e2e-test@example.com',
      password: 'test-password-123',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to register first user: ${res.status} ${text}`)
  }

  const data = await res.json()
  return { token: data.token, userId: data.user.id }
}

/**
 * Log in as an existing user and return the JWT token.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<{ token: string; userId: number }> {
  const res = await fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    throw new Error(`Failed to login: ${res.status}`)
  }

  const data = await res.json()
  return { token: data.token, userId: data.user.id }
}

/**
 * Look up the numeric post ID by slug via the REST API.
 */
export async function getPostIdBySlug(slug: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/posts?where[slug][equals]=${slug}&limit=1`)
  const data = await res.json()

  if (!data.docs?.length) {
    throw new Error(`Post not found with slug: ${slug}`)
  }

  return data.docs[0].id
}

/**
 * Create a comment with status 'approved' so it's visible on the frontend.
 * Requires an authenticated user token.
 */
export async function createApprovedComment(
  token: string,
  postId: number,
  body: string,
): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify({
      authorName: 'Approved Commenter',
      authorEmail: 'approved@example.com',
      body,
      post: postId,
      status: 'approved',
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create comment: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.doc.id
}

/**
 * Delete a comment by ID.
 */
export async function deleteComment(token: string, commentId: number): Promise<void> {
  await fetch(`${BASE_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `JWT ${token}` },
  })
}

/**
 * Delete a user by ID.
 */
export async function deleteUser(token: string, userId: number): Promise<void> {
  await fetch(`${BASE_URL}/api/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `JWT ${token}` },
  })
}
