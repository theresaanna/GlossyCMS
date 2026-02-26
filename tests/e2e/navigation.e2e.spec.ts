import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.describe('Header', () => {
    test('has Posts and Contact nav links', async ({ page }) => {
      await page.goto('/')

      const header = page.locator('header')
      await expect(header.getByRole('link', { name: 'Posts' })).toBeVisible()
      await expect(header.getByRole('link', { name: 'Contact' })).toBeVisible()
    })

    test('Posts link navigates to posts page', async ({ page }) => {
      await page.goto('/')

      await page.locator('header').getByRole('link', { name: 'Posts' }).click()
      await page.waitForURL('/posts')

      await expect(page.getByRole('heading', { level: 1, name: 'Posts' })).toBeVisible()
    })

    test('Contact link navigates to contact page', async ({ page }) => {
      await page.goto('/')

      await page.locator('header').getByRole('link', { name: 'Contact' }).click()
      await page.waitForURL(/\/contact/)

      await expect(page.getByText('Example contact form:')).toBeVisible()
    })

    test('search icon navigates to search page', async ({ page }) => {
      await page.goto('/')

      const searchLink = page.locator('header').getByRole('link', { name: /search/i })
      await searchLink.click()
      await page.waitForURL('/search')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Footer', () => {
    test('displays navigation links', async ({ page }) => {
      await page.goto('/')

      const footer = page.locator('footer')
      await expect(footer.getByRole('link', { name: 'Admin' })).toBeVisible()

      const sourceCodeLink = footer.getByRole('link', { name: 'Source Code' })
      await expect(sourceCodeLink).toBeVisible()
      await expect(sourceCodeLink).toHaveAttribute('target', '_blank')

      const payloadLink = footer.getByRole('link', { name: 'Payload' })
      await expect(payloadLink).toBeVisible()
      await expect(payloadLink).toHaveAttribute('target', '_blank')
    })

    test('site title in footer links to homepage', async ({ page }) => {
      await page.goto('/posts')

      const footer = page.locator('footer')
      const homeLink = footer.getByRole('link').filter({ has: page.locator('[href="/"]') }).first()
      await homeLink.click()
      await page.waitForURL('/')

      await expect(page.locator('h1')).toHaveText('Welcome')
    })
  })
})
