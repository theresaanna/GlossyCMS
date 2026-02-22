'use client'

import React, { useCallback, useState } from 'react'
import type { SitePlan } from '@/utilities/plan'

const PLAN_DETAILS: Record<SitePlan, { name: string; description: string }> = {
  basic: {
    name: 'Basic',
    description: 'Image uploads, blog posts, pages, newsletters, and comments.',
  },
  pro: {
    name: 'Pro',
    description:
      'Everything in Basic, plus audio and video uploads for richer content.',
  },
}

export const SubscriptionViewClient: React.FC<{ plan: SitePlan }> = ({ plan }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManageSubscription = useCallback(async () => {
    setLoading(true)
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
      setLoading(false)
    }
  }, [])

  const details = PLAN_DETAILS[plan]

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

      <div
        style={{
          border: '1px solid var(--theme-border-color)',
          borderRadius: 8,
          padding: '24px',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--theme-bg)',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--theme-text)',
              opacity: 0.5,
            }}
          >
            Current Plan
          </span>
        </div>
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--theme-text)',
          }}
        >
          {details.name}
        </div>
        <div
          style={{
            fontSize: '0.875rem',
            color: 'var(--theme-text)',
            opacity: 0.7,
            lineHeight: 1.5,
          }}
        >
          {details.description}
        </div>
      </div>

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
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          fontSize: '0.875rem',
          fontWeight: 500,
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'wait' : 'pointer',
          backgroundColor: 'var(--theme-elevation-500)',
          color: 'var(--theme-elevation-0)',
          opacity: loading ? 0.7 : 1,
          transition: 'opacity 150ms ease',
        }}
      >
        {loading ? 'Opening...' : 'Manage Subscription'}
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
        Manage your plan, payment method, and billing history through the Stripe Customer
        Portal.
      </p>
    </div>
  )
}
