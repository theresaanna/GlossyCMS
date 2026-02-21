import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../SignupForm'

// Mock the server action
const mockCreateSite = vi.fn()
vi.mock('../actions', () => ({
  createSite: (...args: unknown[]) => mockCreateSite(...args),
}))

// Mock fetch for subdomain availability checks
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.location for redirect tests
const mockLocationAssign = vi.fn()
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    href: '',
    search: '',
    assign: mockLocationAssign,
  },
  writable: true,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({ available: true }),
  })
  window.location.search = ''
})

describe('SignupForm', () => {
  it('renders the form with heading, plan selector, and all fields', () => {
    render(<SignupForm />)

    expect(screen.getByText('Create Your Site')).toBeDefined()
    expect(screen.getByText('Basic')).toBeDefined()
    expect(screen.getByText('Pro')).toBeDefined()
    expect(screen.getByText('$10')).toBeDefined()
    expect(screen.getByText('$20')).toBeDefined()
    expect(screen.getByLabelText(/subdomain/i)).toBeDefined()
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/your name/i)).toBeDefined()
    expect(screen.getByLabelText(/site name/i)).toBeDefined()
    expect(screen.getByLabelText(/site description/i)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Continue to Payment' })).toBeDefined()
  })

  it('redirects to Stripe Checkout on successful submission', async () => {
    mockCreateSite.mockResolvedValue({
      success: true,
      message: 'Redirecting to payment...',
      checkoutUrl: 'https://checkout.stripe.com/test-session',
      siteId: 42,
      subdomain: 'my-site',
    })

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'my-site')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue to Payment' }))

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/test-session')
    })
  })

  it('sends plan value in form data', async () => {
    mockCreateSite.mockResolvedValue({
      success: true,
      message: 'Redirecting to payment...',
      checkoutUrl: 'https://checkout.stripe.com/test-session',
      siteId: 42,
      subdomain: 'my-site',
    })

    render(<SignupForm />)

    const user = userEvent.setup()

    // Click Pro plan
    await user.click(screen.getByText('Pro'))

    await user.type(screen.getByLabelText(/subdomain/i), 'my-site')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue to Payment' }))

    await waitFor(() => {
      expect(mockCreateSite).toHaveBeenCalled()
    })

    const formData = mockCreateSite.mock.calls[0][0] as FormData
    expect(formData.get('plan')).toBe('pro')
  })

  it('shows an error and keeps the form visible on failure', async () => {
    mockCreateSite.mockResolvedValue({
      success: false,
      message: 'The subdomain "taken" is already taken.',
    })

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'taken')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue to Payment' }))

    await waitFor(() => {
      expect(screen.getByText('The subdomain "taken" is already taken.')).toBeDefined()
    })

    // Form should still be visible
    expect(screen.getByLabelText(/subdomain/i)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Continue to Payment' })).toBeDefined()
  })

  it('shows an error when the action throws unexpectedly', async () => {
    mockCreateSite.mockRejectedValue(new Error('Network error'))

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'my-site')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Continue to Payment' }))

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeDefined()
    })

    // Form should still be visible and re-enabled
    expect(screen.getByRole('button', { name: 'Continue to Payment' })).toBeDefined()
  })

  it('disables the submit button when subdomain is checking or unavailable', async () => {
    // Return "checking" state — the button should be disabled
    mockFetch.mockImplementation(
      () => new Promise(() => {}), // Never resolves, simulating a slow check
    )

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'my-site')

    // Wait for the debounced check to trigger
    await waitFor(() => {
      expect(screen.getByText('Checking availability...')).toBeDefined()
    })

    const button = screen.getByRole('button', { name: 'Continue to Payment' })
    expect(button.hasAttribute('disabled')).toBe(true)
  })
})
