'use client'

import React, { useCallback, useState } from 'react'
import type { SitePlan } from '@/utilities/plan'

const PLAN_DETAILS: Record<SitePlan, { name: string; price: string; description: string }> = {
  basic: {
    name: 'Basic',
    price: '$10/mo',
    description: 'Image uploads, blog posts, pages, newsletters, and comments.',
  },
  pro: {
    name: 'Pro',
    price: '$20/mo',
    description:
      'Everything in Basic, plus audio and video uploads for richer content.',
  },
}

const ALL_PLANS: SitePlan[] = ['basic', 'pro']

export const SubscriptionViewClient: React.FC<{ plan: SitePlan }> = ({ plan }) => {
  const [portalLoading, setPortalLoading] = useState(false)
  const [changePlanLoading, setChangePlanLoading] = useState(false)
  const [confirmingPlan, setConfirmingPlan] = useState<SitePlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleManageSubscription = useCallback(async () => {
    setPortalLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/subscription/portal-session', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to open billing portal. Please try again.')
        return
      }

      const { url } = await response.json()
      window.location.href = url
    } catch {
      setError('Failed to connect to billing service. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }, [])

  const handleChangePlan = useCallback(async (newPlan: SitePlan) => {
    setChangePlanLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Failed to change plan. Please try again.')
        return
      }

      const action = newPlan === 'pro' ? 'upgraded' : 'downgraded'
      setSuccessMessage(
        `Successfully ${action} to ${PLAN_DETAILS[newPlan].name}. Your site will redeploy with the new plan shortly.`,
      )
    } catch {
      setError('Failed to connect to billing service. Please try again.')
    } finally {
      setChangePlanLoading(false)
      setConfirmingPlan(null)
    }
  }, [])

  const isUpgrade = (targetPlan: SitePlan) => targetPlan === 'pro'

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '40px 20px',
      }}
    >
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '2rem',
          color: 'var(--theme-text)',
        }}
      >
        Subscription
      </h1>

      {/* Plan Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '1.5rem',
        }}
      >
        {ALL_PLANS.map((p) => {
          const details = PLAN_DETAILS[p]
          const isCurrent = p === plan
          const isTarget = !isCurrent

          return (
            <div
              key={p}
              style={{
                border: isCurrent
                  ? '2px solid var(--theme-elevation-500)'
                  : '1px solid var(--theme-border-color)',
                borderRadius: 8,
                padding: '24px',
                backgroundColor: 'var(--theme-bg)',
                position: 'relative',
              }}
            >
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: 'var(--theme-elevation-500)',
                    color: 'var(--theme-elevation-0)',
                  }}
                >
                  Current
                </div>
              )}

              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                  color: 'var(--theme-text)',
                }}
              >
                {details.name}
              </div>

              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--theme-text)',
                }}
              >
                {details.price}
              </div>

              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--theme-text)',
                  opacity: 0.7,
                  lineHeight: 1.5,
                  marginBottom: isTarget ? '16px' : 0,
                }}
              >
                {details.description}
              </div>

              {isTarget && !successMessage && (
                <button
                  onClick={() => setConfirmingPlan(p)}
                  disabled={changePlanLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: 'none',
                    borderRadius: 6,
                    cursor: changePlanLoading ? 'wait' : 'pointer',
                    backgroundColor: isUpgrade(p)
                      ? 'var(--theme-elevation-500)'
                      : 'transparent',
                    color: isUpgrade(p)
                      ? 'var(--theme-elevation-0)'
                      : 'var(--theme-text)',
                    ...(isUpgrade(p)
                      ? {}
                      : { border: '1px solid var(--theme-border-color)' }),
                    opacity: changePlanLoading ? 0.7 : 1,
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {isUpgrade(p) ? 'Upgrade' : 'Downgrade'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirmation Dialog */}
      {confirmingPlan && (
        <div
          role="dialog"
          aria-label="Confirm plan change"
          style={{
            border: '1px solid var(--theme-border-color)',
            borderRadius: 8,
            padding: '20px',
            marginBottom: '1.5rem',
            backgroundColor: 'var(--theme-bg)',
          }}
        >
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              marginBottom: '8px',
              color: 'var(--theme-text)',
            }}
          >
            {isUpgrade(confirmingPlan)
              ? `Upgrade to ${PLAN_DETAILS[confirmingPlan].name}?`
              : `Downgrade to ${PLAN_DETAILS[confirmingPlan].name}?`}
          </div>

          <div
            style={{
              fontSize: '0.8125rem',
              color: 'var(--theme-text)',
              opacity: 0.7,
              lineHeight: 1.5,
              marginBottom: '16px',
            }}
          >
            {isUpgrade(confirmingPlan) ? (
              <>
                You&apos;ll be charged a prorated amount for the remainder of your current
                billing period. Audio and video uploads will be enabled after your site redeploys.
              </>
            ) : (
              <>
                Your plan will change at the end of your current billing period with prorated
                adjustments. <strong>All audio and video files will be permanently deleted</strong>{' '}
                when the downgrade takes effect.
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleChangePlan(confirmingPlan)}
              disabled={changePlanLoading}
              style={{
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: 'none',
                borderRadius: 6,
                cursor: changePlanLoading ? 'wait' : 'pointer',
                backgroundColor: isUpgrade(confirmingPlan)
                  ? 'var(--theme-elevation-500)'
                  : 'var(--theme-error-500, #ef4444)',
                color: '#fff',
                opacity: changePlanLoading ? 0.7 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {changePlanLoading
                ? 'Changing...'
                : isUpgrade(confirmingPlan)
                  ? 'Confirm Upgrade'
                  : 'Confirm Downgrade'}
            </button>
            <button
              onClick={() => setConfirmingPlan(null)}
              disabled={changePlanLoading}
              style={{
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: '1px solid var(--theme-border-color)',
                borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: 'var(--theme-text)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            marginBottom: '1rem',
            borderRadius: 6,
            backgroundColor: 'var(--theme-success-50, #f0fdf4)',
            color: 'var(--theme-success-500, #22c55e)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            marginBottom: '1rem',
            borderRadius: 6,
            backgroundColor: 'var(--theme-error-50, #fef2f2)',
            color: 'var(--theme-error-500, #ef4444)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleManageSubscription}
        disabled={portalLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          border: 'none',
          borderRadius: 6,
          cursor: portalLoading ? 'wait' : 'pointer',
          backgroundColor: 'var(--theme-elevation-500)',
          color: 'var(--theme-elevation-0)',
          opacity: portalLoading ? 0.7 : 1,
          transition: 'opacity 150ms ease',
        }}
      >
        {portalLoading ? 'Opening...' : 'Manage Billing'}
      </button>

      <p
        style={{
          marginTop: '1rem',
          fontSize: '0.8125rem',
          color: 'var(--theme-text)',
          opacity: 0.5,
          lineHeight: 1.5,
        }}
      >
        Manage your payment method, billing history, and cancellation through the Stripe
        Customer Portal.
      </p>
    </div>
  )
}
