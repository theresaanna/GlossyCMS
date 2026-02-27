'use client'

import React, { useCallback, useEffect, useState } from 'react'

type SiteStatus = 'pending_payment' | 'pending' | 'provisioning' | 'active' | 'failed' | 'suspended'

interface Props {
  siteId: number | string
  initialStatus: string
  subdomain: string
  initialError?: string
}

const STATUS_MESSAGES: Record<SiteStatus, string> = {
  pending_payment: 'Confirming your payment...',
  pending: 'Your site is queued for setup...',
  provisioning: 'Setting up your site...',
  active: 'Your site is live!',
  failed: 'Something went wrong during setup.',
  suspended: 'Your site has been suspended.',
}

const POLL_INTERVAL_MS = 3000

export const ProvisioningStatus: React.FC<Props> = ({
  siteId,
  initialStatus,
  subdomain,
  initialError,
}) => {
  const [status, setStatus] = useState<SiteStatus>(initialStatus as SiteStatus)
  const [error, setError] = useState(initialError)

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/provisioning/status/${siteId}`)
      if (!response.ok) return
      const data = await response.json()
      setStatus(data.status as SiteStatus)
      if (data.provisioningError) {
        setError(data.provisioningError)
      }
    } catch {
      // Silently ignore polling errors
    }
  }, [siteId])

  useEffect(() => {
    if (status === 'active' || status === 'failed' || status === 'suspended') {
      return
    }

    const interval = setInterval(pollStatus, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [status, pollStatus])

  const domain = `${subdomain}.glossysites.live`
  const siteUrl = `https://${domain}`
  const adminUrl = `${siteUrl}/admin`

  return (
    <div className="text-center">
      {/* Status indicator */}
      <div className="mb-8">
        {(status === 'pending_payment' || status === 'pending' || status === 'provisioning') && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {status === 'active' && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/30 mb-4">
            <svg
              className="w-8 h-8 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'failed' && (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/30 mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-2">{STATUS_MESSAGES[status]}</h1>

        {status === 'pending_payment' && (
          <p className="text-muted-foreground">
            We&apos;re confirming your payment. This should only take a moment.
          </p>
        )}
        {(status === 'pending' || status === 'provisioning') && (
          <p className="text-muted-foreground">
            This usually takes about a minute. We&apos;re creating your database, configuring your
            domain, and deploying your site.
          </p>
        )}
      </div>

      {/* Progress steps */}
      {(status === 'pending_payment' || status === 'pending' || status === 'provisioning') && (
        <div className="text-left max-w-sm mx-auto mb-8 space-y-3">
          <ProgressStep
            label="Confirming payment"
            done={status !== 'pending_payment'}
            active={status === 'pending_payment'}
          />
          <ProgressStep
            label="Creating project"
            done={status === 'provisioning'}
            active={status === 'pending'}
          />
          <ProgressStep
            label="Setting up database"
            done={false}
            active={status === 'provisioning'}
          />
          <ProgressStep label="Configuring domain" done={false} active={false} />
          <ProgressStep label="Deploying site" done={false} active={false} />
        </div>
      )}

      {/* Success state */}
      {status === 'active' && (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Your site is deployed at{' '}
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {domain}
            </a>
          </p>

          <div className="rounded-md border border-border bg-muted/50 p-6 text-left">
            <h2 className="text-lg font-semibold mb-2">Next steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Visit your{' '}
                <a
                  href={adminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  admin panel
                </a>{' '}
                to create your first admin account
              </li>
              <li>Customize your site settings (name, colors, logo)</li>
              <li>Start creating pages and posts</li>
            </ol>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Your site may take a few minutes to become fully available while the first
            deployment completes.
          </p>
        </div>
      )}

      {/* Failed state */}
      {status === 'failed' && (
        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-error bg-error/30 px-4 py-3 text-sm text-left">
              {error}
            </div>
          )}
          <p className="text-muted-foreground">
            Please try again or contact support if the problem persists.
          </p>
          <a
            href="/signup"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </a>
        </div>
      )}
    </div>
  )
}

function ProgressStep({
  label,
  done,
  active,
}: {
  label: string
  done: boolean
  active: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          done
            ? 'bg-success'
            : active
              ? 'bg-primary'
              : 'bg-muted-foreground/20'
        }`}
      >
        {done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {active && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
      </div>
      <span
        className={`text-sm ${
          done
            ? 'text-foreground'
            : active
              ? 'text-foreground font-medium'
              : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
