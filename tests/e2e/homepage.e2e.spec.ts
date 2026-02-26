import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('has correct page title', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Home/)
  })

  test('displays hero section with Welcome heading', async ({ page }) => {
    await page.goto('/')

    const heading = page.locator('h1')
    await expect(heading).toHaveText('Welcome')
  })

  test('hero has CTA links to posts and contact', async ({ page }) => {
    await page.goto('/')

    const allPostsLink = page.getByRole('link', { name: 'All posts' }).first()
    await expect(allPostsLink).toBeVisible()
    await expect(allPostsLink).toHaveAttribute('href', '/posts')

    const contactLink = page.getByRole('link', { name: 'Contact' }).first()
    await expect(contactLink).toBeVisible()
    await expect(contactLink).toHaveAttribute('href', '/contact')
  })

  test('displays Core features section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Core features' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Page Builder' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SEO' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Dark Mode' })).toBeVisible()
  })

  test('displays Recent posts archive with post cards', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Recent posts' })).toBeVisible()

    // All 3 seeded post titles should appear as cards
    await expect(page.getByText('Digital Horizons: A Glimpse into Tomorrow')).toBeVisible()
    await expect(page.getByText('Global Gaze: Beyond the Headlines')).toBeVisible()
    await expect(page.getByText('Dollar and Sense: The Financial Forecast')).toBeVisible()
  })

  test('has correct meta description', async ({ page }) => {
    await page.goto('/')

    const metaDescription = page.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', 'A website powered by GlossyCMS.')
  })
})
