import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test('displays search heading and input', async ({ page }) => {
    await page.goto('/search')

    await expect(page).toHaveTitle(/Search/)
    await expect(page.getByPlaceholder('Search')).toBeVisible()
  })

  test('header search icon navigates to search page', async ({ page }) => {
    await page.goto('/')

    const searchLink = page.locator('header').getByRole('link', { name: /search/i })
    await searchLink.click()
    await page.waitForURL('/search')

    await expect(page.getByPlaceholder('Search')).toBeVisible()
  })

  test('typing a query updates URL with search parameter', async ({ page }) => {
    await page.goto('/search')

    const searchInput = page.getByPlaceholder('Search')
    await searchInput.fill('digital')

    // Wait for debounced URL update
    await page.waitForURL(/[?&]q=digital/, { timeout: 5000 })
  })

  test('direct URL with query shows search results or no results', async ({ page }) => {
    await page.goto('/search?q=horizons')

    // Should show either matching results or "No results found"
    const hasResults = await page.getByText('Digital Horizons').isVisible().catch(() => false)
    const hasNoResults = await page.getByText(/no results/i).isVisible().catch(() => false)

    expect(hasResults || hasNoResults).toBe(true)
  })
})
