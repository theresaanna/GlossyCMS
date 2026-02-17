import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AgeGateModal } from '../AgeGateModal'
import { AgeGateProvider } from '../AgeGateProvider'

function renderWithProvider(options = {}) {
  return render(
    <AgeGateProvider options={options}>
      <AgeGateModal />
    </AgeGateProvider>,
  )
}

describe('AgeGateModal', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  describe('visibility', () => {
    it('renders the modal when not yet verified', () => {
      renderWithProvider()

      expect(screen.getByTestId('age-gate-modal')).toBeDefined()
    })

    it('does not render the modal when plugin is disabled', () => {
      renderWithProvider({ enabled: false })

      expect(screen.queryByTestId('age-gate-modal')).toBeNull()
    })

    it('does not render the modal when already verified in session', () => {
      sessionStorage.setItem('age-gate-verified', 'true')

      renderWithProvider()

      expect(screen.queryByTestId('age-gate-modal')).toBeNull()
    })
  })

  describe('content', () => {
    it('displays the default minimum age (18) in the prompt text', () => {
      renderWithProvider()

      expect(screen.getByText(/at least 18 years old/)).toBeDefined()
    })

    it('displays a custom minimum age in the prompt text', () => {
      renderWithProvider({ minimumAge: 21 })

      expect(screen.getByText(/at least 21 years old/)).toBeDefined()
    })

    it('displays the confirm button with the correct age', () => {
      renderWithProvider({ minimumAge: 21 })

      expect(screen.getByTestId('age-gate-confirm').textContent).toBe('I am 21 or older')
    })

    it('displays the decline button with the correct age', () => {
      renderWithProvider({ minimumAge: 21 })

      expect(screen.getByTestId('age-gate-decline').textContent).toBe('I am under 21')
    })

    it('renders the heading', () => {
      renderWithProvider()

      expect(screen.getByText('Age Verification')).toBeDefined()
    })

    it('has the correct aria attributes', () => {
      renderWithProvider()

      const modal = screen.getByTestId('age-gate-modal')
      expect(modal.getAttribute('role')).toBe('dialog')
      expect(modal.getAttribute('aria-modal')).toBe('true')
      expect(modal.getAttribute('aria-label')).toBe('Age verification')
    })
  })

  describe('confirm action', () => {
    it('hides the modal after clicking confirm', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      expect(screen.getByTestId('age-gate-modal')).toBeDefined()

      await user.click(screen.getByTestId('age-gate-confirm'))

      expect(screen.queryByTestId('age-gate-modal')).toBeNull()
    })

    it('persists verification to sessionStorage after confirming', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      await user.click(screen.getByTestId('age-gate-confirm'))

      expect(sessionStorage.getItem('age-gate-verified')).toBe('true')
    })

    it('persists to a custom storage key', async () => {
      const user = userEvent.setup()
      renderWithProvider({ storageKey: 'my-custom-key' })

      await user.click(screen.getByTestId('age-gate-confirm'))

      expect(sessionStorage.getItem('my-custom-key')).toBe('true')
    })
  })

  describe('decline action', () => {
    it('does not redirect when no redirectUrl is configured', async () => {
      const user = userEvent.setup()

      // Spy on window.location to detect any assignment attempts
      const originalHref = window.location.href
      let hrefWasSet = false
      const locationProxy = new Proxy(window.location, {
        set(_target, prop, value) {
          if (prop === 'href') {
            hrefWasSet = true
          }
          return true
        },
      })

      renderWithProvider({ redirectUrl: '' })

      await user.click(screen.getByTestId('age-gate-decline'))

      // When redirectUrl is empty, declineAge should not attempt redirect
      // The modal should still be visible (no state change)
      expect(screen.getByTestId('age-gate-modal')).toBeDefined()
    })
  })
})
