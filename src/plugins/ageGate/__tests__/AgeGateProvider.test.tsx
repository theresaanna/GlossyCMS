import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { AgeGateProvider, useAgeGate } from '../AgeGateProvider'

beforeEach(() => {
  sessionStorage.clear()
})

describe('useAgeGate', () => {
  it('throws when used outside of AgeGateProvider', () => {
    // Suppress React error boundary logging
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAgeGate())
    }).toThrow('useAgeGate must be used within an <AgeGateProvider>')

    consoleSpy.mockRestore()
  })
})

describe('AgeGateProvider', () => {
  function TestConsumer() {
    const { isVerified, showGate, options } = useAgeGate()
    return (
      <div>
        <span data-testid="is-verified">{String(isVerified)}</span>
        <span data-testid="show-gate">{String(showGate)}</span>
        <span data-testid="minimum-age">{options.minimumAge}</span>
        <span data-testid="storage-key">{options.storageKey}</span>
        <span data-testid="enabled">{String(options.enabled)}</span>
      </div>
    )
  }

  it('renders children', () => {
    render(
      <AgeGateProvider>
        <span data-testid="child">Hello</span>
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('child').textContent).toBe('Hello')
  })

  it('provides default options to consumers', () => {
    render(
      <AgeGateProvider>
        <TestConsumer />
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('minimum-age').textContent).toBe('18')
    expect(screen.getByTestId('storage-key').textContent).toBe('age-gate-verified')
    expect(screen.getByTestId('enabled').textContent).toBe('true')
  })

  it('provides custom options to consumers', () => {
    render(
      <AgeGateProvider options={{ minimumAge: 21, storageKey: 'custom-key' }}>
        <TestConsumer />
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('minimum-age').textContent).toBe('21')
    expect(screen.getByTestId('storage-key').textContent).toBe('custom-key')
  })

  it('shows the gate when user is not verified and plugin is enabled', () => {
    render(
      <AgeGateProvider>
        <TestConsumer />
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('show-gate').textContent).toBe('true')
    expect(screen.getByTestId('is-verified').textContent).toBe('false')
  })

  it('does not show the gate when plugin is disabled', () => {
    render(
      <AgeGateProvider options={{ enabled: false }}>
        <TestConsumer />
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('show-gate').textContent).toBe('false')
  })

  it('does not show the gate when user is already verified in session', () => {
    sessionStorage.setItem('age-gate-verified', 'true')

    render(
      <AgeGateProvider>
        <TestConsumer />
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('show-gate').textContent).toBe('false')
    expect(screen.getByTestId('is-verified').textContent).toBe('true')
  })

  it('reads from the correct custom storage key', () => {
    sessionStorage.setItem('my-gate', 'true')

    render(
      <AgeGateProvider options={{ storageKey: 'my-gate' }}>
        <TestConsumer />
      </AgeGateProvider>,
    )

    expect(screen.getByTestId('is-verified').textContent).toBe('true')
    expect(screen.getByTestId('show-gate').textContent).toBe('false')
  })

  describe('confirmAge', () => {
    function ConfirmConsumer() {
      const { confirmAge, isVerified, showGate } = useAgeGate()
      return (
        <div>
          <button data-testid="confirm-btn" onClick={confirmAge}>
            Confirm
          </button>
          <span data-testid="is-verified">{String(isVerified)}</span>
          <span data-testid="show-gate">{String(showGate)}</span>
        </div>
      )
    }

    it('sets isVerified to true after calling confirmAge', async () => {
      const user = userEvent.setup()
      render(
        <AgeGateProvider>
          <ConfirmConsumer />
        </AgeGateProvider>,
      )

      expect(screen.getByTestId('is-verified').textContent).toBe('false')

      await user.click(screen.getByTestId('confirm-btn'))

      expect(screen.getByTestId('is-verified').textContent).toBe('true')
    })

    it('hides the gate after confirming', async () => {
      const user = userEvent.setup()
      render(
        <AgeGateProvider>
          <ConfirmConsumer />
        </AgeGateProvider>,
      )

      expect(screen.getByTestId('show-gate').textContent).toBe('true')

      await user.click(screen.getByTestId('confirm-btn'))

      expect(screen.getByTestId('show-gate').textContent).toBe('false')
    })

    it('writes to sessionStorage when confirming', async () => {
      const user = userEvent.setup()
      render(
        <AgeGateProvider>
          <ConfirmConsumer />
        </AgeGateProvider>,
      )

      await user.click(screen.getByTestId('confirm-btn'))

      expect(sessionStorage.getItem('age-gate-verified')).toBe('true')
    })
  })

  describe('declineAge', () => {
    it('does not change verified state when declining', async () => {
      const user = userEvent.setup()

      function DeclineConsumer() {
        const { declineAge, isVerified, showGate } = useAgeGate()
        return (
          <div>
            <button data-testid="decline-btn" onClick={declineAge}>
              Leave
            </button>
            <span data-testid="is-verified">{String(isVerified)}</span>
            <span data-testid="show-gate">{String(showGate)}</span>
          </div>
        )
      }

      render(
        <AgeGateProvider options={{ redirectUrl: '' }}>
          <DeclineConsumer />
        </AgeGateProvider>,
      )

      await user.click(screen.getByTestId('decline-btn'))

      // Declining without a redirect URL should not change verified state
      expect(screen.getByTestId('is-verified').textContent).toBe('false')
      expect(screen.getByTestId('show-gate').textContent).toBe('true')
    })

    it('does not write to sessionStorage when declining', async () => {
      const user = userEvent.setup()

      function DeclineConsumer() {
        const { declineAge } = useAgeGate()
        return (
          <button data-testid="decline-btn" onClick={declineAge}>
            Leave
          </button>
        )
      }

      render(
        <AgeGateProvider options={{ redirectUrl: '' }}>
          <DeclineConsumer />
        </AgeGateProvider>,
      )

      await user.click(screen.getByTestId('decline-btn'))

      expect(sessionStorage.getItem('age-gate-verified')).toBeNull()
    })
  })
})
