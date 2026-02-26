import { test, expect } from '@playwright/test'
import { POSTS } from './helpers'

test.describe('Post Detail', () => {
  test('displays post title', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    await expect(
      page.getByRole('heading', { level: 1, name: POSTS.digitalHorizons.title }),
    ).toBeVisible()
  })

  test('displays post content headings', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    // Post 1 has these content headings
    await expect(
      page.getByRole('heading', { name: 'The Rise of AI and Machine Learning' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'IoT: Connecting the World Around Us' }),
    ).toBeVisible()
  })

  test('displays hero image', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    // The post detail page includes a hero image
    const heroImage = page.locator('article img, [class*="hero"] img').first()
    await expect(heroImage).toBeVisible()
  })

  test('displays related posts', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    // RelatedPosts component renders cards without a heading
    // Post 1 is related to Post 2 and Post 3 — their titles should appear as cards
    await expect(page.getByText(POSTS.globalGaze.title).last()).toBeVisible()
    await expect(page.getByText(POSTS.dollarAndSense.title).last()).toBeVisible()
  })

  test('displays comment form', async ({ page }) => {
    await page.goto(POSTS.digitalHorizons.url)

    // Comment form fields should be present (the section is rendered by a server component)
    await expect(page.getByPlaceholder('Your name')).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Write your comment...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Post Comment' })).toBeVisible()
  })

  test('all post slugs resolve correctly', async ({ page }) => {
    for (const post of Object.values(POSTS)) {
      await page.goto(post.url)
      await expect(page.getByRole('heading', { level: 1, name: post.title })).toBeVisible()
    }
  })
})
