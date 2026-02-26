import { test, expect } from '@playwright/test'

test.describe('Contact Form', () => {
  test('displays form heading', async ({ page }) => {
    await page.goto('/contact')

    await expect(page.getByRole('heading', { name: 'Example contact form:' })).toBeVisible()
  })

  test('has all form fields and submit button', async ({ page }) => {
    await page.goto('/contact')

    // Text field: Full Name (id="full-name")
    await expect(page.locator('label[for="full-name"]')).toBeVisible()
    await expect(page.locator('#full-name')).toBeVisible()

    // Email field: Email (id="email")
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()

    // Number field: Phone (id="phone")
    await expect(page.locator('label[for="phone"]')).toBeVisible()
    await expect(page.locator('#phone')).toBeVisible()

    // Textarea field: Message (id="message")
    await expect(page.locator('label[for="message"]')).toBeVisible()
    await expect(page.locator('#message')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
  })

  test('required fields show indicators', async ({ page }) => {
    await page.goto('/contact')

    // Full Name, Email, and Message are required — labels contain "*"
    const fullNameLabel = page.locator('label[for="full-name"]')
    await expect(fullNameLabel.locator('.required')).toBeVisible()

    const emailLabel = page.locator('label[for="email"]')
    await expect(emailLabel.locator('.required')).toBeVisible()

    const messageLabel = page.locator('label[for="message"]')
    await expect(messageLabel.locator('.required')).toBeVisible()

    // Phone is NOT required
    const phoneLabel = page.locator('label[for="phone"]')
    await expect(phoneLabel.locator('.required')).toHaveCount(0)
  })

  test('successful submission shows confirmation message', async ({ page }) => {
    await page.goto('/contact')

    // Fill in required fields
    await page.locator('#full-name').fill('Test User')
    await page.locator('#email').fill('test@example.com')
    await page.locator('#message').fill('This is a test message from E2E tests.')

    // Submit the form
    await page.getByRole('button', { name: 'Submit' }).click()

    // Wait for confirmation message
    await expect(
      page.getByText('The contact form has been submitted successfully.'),
    ).toBeVisible({ timeout: 10000 })
  })

  test('form does not submit without required fields', async ({ page }) => {
    await page.goto('/contact')

    // Only fill optional phone field
    await page.locator('#phone').fill('1234567890')

    // Click submit
    await page.getByRole('button', { name: 'Submit' }).click()

    // Confirmation message should NOT appear — form validation prevents submission
    await expect(
      page.getByText('The contact form has been submitted successfully.'),
    ).not.toBeVisible()

    // The form should still be visible (not replaced by confirmation)
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
  })
})
