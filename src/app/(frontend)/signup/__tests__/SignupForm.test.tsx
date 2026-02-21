import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '../SignupForm'

// Mock the server action
const mockCreateSite = vi.fn()
vi.mock('../actions', () => ({
  createSite: (...args: unknown[]) => mockCreateSite(...args),
}))

// Mock ProvisioningStatus to verify it receives the right props
vi.mock('../status/[id]/ProvisioningStatus', () => ({
  ProvisioningStatus: (props: { siteId: number | string; initialStatus: string; subdomain: string }) => (
    <div data-testid="provisioning-status" data-site-id={props.siteId} data-subdomain={props.subdomain}>
      {props.initialStatus}
    </div>
  ),
}))

// Mock fetch for subdomain availability checks
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({ available: true }),
  })
})

describe('SignupForm', () => {
  it('renders the form with heading and all fields', () => {
    render(<SignupForm />)

    expect(screen.getByText('Create Your Site')).toBeDefined()
    expect(screen.getByLabelText(/subdomain/i)).toBeDefined()
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/your name/i)).toBeDefined()
    expect(screen.getByLabelText(/site name/i)).toBeDefined()
    expect(screen.getByLabelText(/site description/i)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Create Site' })).toBeDefined()
  })

  it('shows provisioning status after successful submission', async () => {
    mockCreateSite.mockResolvedValue({
      success: true,
      message: 'Site created.',
      siteId: 42,
      subdomain: 'my-site',
    })

    render(<SignupForm />)

    const user = userEvent.setup()
    const subdomainInput = screen.getByLabelText(/subdomain/i)
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: 'Create Site' })

    await user.type(subdomainInput, 'my-site')
    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('provisioning-status')).toBeDefined()
    })

    const status = screen.getByTestId('provisioning-status')
    expect(status.getAttribute('data-site-id')).toBe('42')
    expect(status.getAttribute('data-subdomain')).toBe('my-site')
    expect(status.textContent).toBe('pending')
  })

  it('hides the form and heading when provisioning starts', async () => {
    mockCreateSite.mockResolvedValue({
      success: true,
      message: 'Site created.',
      siteId: 1,
      subdomain: 'test-site',
    })

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'test-site')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Create Site' }))

    await waitFor(() => {
      expect(screen.getByTestId('provisioning-status')).toBeDefined()
    })

    expect(screen.queryByText('Create Your Site')).toBeNull()
    expect(screen.queryByLabelText(/subdomain/i)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Create Site' })).toBeNull()
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
    await user.click(screen.getByRole('button', { name: 'Create Site' }))

    await waitFor(() => {
      expect(screen.getByText('The subdomain "taken" is already taken.')).toBeDefined()
    })

    // Form should still be visible
    expect(screen.getByLabelText(/subdomain/i)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Create Site' })).toBeDefined()
    expect(screen.queryByTestId('provisioning-status')).toBeNull()
  })

  it('shows an error when the action throws unexpectedly', async () => {
    mockCreateSite.mockRejectedValue(new Error('Network error'))

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'my-site')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Create Site' }))

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeDefined()
    })

    // Form should still be visible and re-enabled
    expect(screen.getByRole('button', { name: 'Create Site' })).toBeDefined()
    expect(screen.queryByTestId('provisioning-status')).toBeNull()
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

    const button = screen.getByRole('button', { name: 'Create Site' })
    expect(button.hasAttribute('disabled')).toBe(true)
  })

  it('scrolls to top when provisioning begins', async () => {
    const scrollIntoViewMock = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoViewMock

    mockCreateSite.mockResolvedValue({
      success: true,
      message: 'Site created.',
      siteId: 1,
      subdomain: 'my-site',
    })

    render(<SignupForm />)

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/subdomain/i), 'my-site')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'Create Site' }))

    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' })
    })
  })
})
