import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ProvisioningStatus } from '../ProvisioningStatus'

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ProvisioningStatus', () => {
  it('renders pending state with spinner and progress steps', () => {
    render(
      <ProvisioningStatus siteId={1} initialStatus="pending" subdomain="test-site" />,
    )

    expect(screen.getByText('Your site is queued for setup...')).toBeDefined()
    expect(screen.getByText('Creating project')).toBeDefined()
    expect(screen.getByText('Setting up database')).toBeDefined()
    expect(screen.getByText('Configuring domain')).toBeDefined()
    expect(screen.getByText('Deploying site')).toBeDefined()
  })

  it('renders provisioning state', () => {
    render(
      <ProvisioningStatus siteId={1} initialStatus="provisioning" subdomain="test-site" />,
    )

    expect(screen.getByText('Setting up your site...')).toBeDefined()
  })

  it('renders active state with site links', () => {
    render(
      <ProvisioningStatus siteId={1} initialStatus="active" subdomain="test-site" />,
    )

    expect(screen.getByText('Your site is live!')).toBeDefined()
    const siteLink = screen.getByText('test-site.glossysites.live')
    expect(siteLink.closest('a')?.getAttribute('href')).toBe('https://test-site.glossysites.live')

    const adminLink = screen.getByText('admin panel')
    expect(adminLink.closest('a')?.getAttribute('href')).toBe(
      'https://test-site.glossysites.live/admin',
    )
  })

  it('renders failed state with error message', () => {
    render(
      <ProvisioningStatus
        siteId={1}
        initialStatus="failed"
        subdomain="test-site"
        initialError="Database creation failed"
      />,
    )

    expect(screen.getByText('Something went wrong during setup.')).toBeDefined()
    expect(screen.getByText('Database creation failed')).toBeDefined()
    expect(screen.getByText('Try Again')).toBeDefined()
  })

  it('polls for status updates when pending', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'provisioning' }),
    })

    render(
      <ProvisioningStatus siteId={42} initialStatus="pending" subdomain="test-site" />,
    )

    await vi.advanceTimersByTimeAsync(3000)

    expect(mockFetch).toHaveBeenCalledWith('/api/provisioning/status/42')
  })

  it('updates UI when polling returns active status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'active', provisionedAt: new Date().toISOString() }),
    })

    render(
      <ProvisioningStatus siteId={1} initialStatus="pending" subdomain="test-site" />,
    )

    // Initially shows pending
    expect(screen.getByText('Your site is queued for setup...')).toBeDefined()

    // Advance past poll interval and flush React state updates
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    // After polling, should show active state
    expect(screen.getByText('Your site is live!')).toBeDefined()
  })

  it('does not poll when initial status is a terminal state', async () => {
    render(
      <ProvisioningStatus siteId={1} initialStatus="active" subdomain="test-site" />,
    )

    await vi.advanceTimersByTimeAsync(3000)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not poll when initial status is failed', async () => {
    render(
      <ProvisioningStatus
        siteId={1}
        initialStatus="failed"
        subdomain="test-site"
        initialError="Something broke"
      />,
    )

    await vi.advanceTimersByTimeAsync(3000)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
