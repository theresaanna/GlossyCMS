'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createSite } from './actions'

type AvailabilityState = 'idle' | 'checking' | 'available' | 'unavailable'
type Plan = 'basic' | 'pro'

export const SignupForm: React.FC = () => {
  const [subdomain, setSubdomain] = useState('')
  const [availability, setAvailability] = useState<AvailabilityState>('idle')
  const [availabilityReason, setAvailabilityReason] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [plan, setPlan] = useState<Plan>('basic')
  const [cancelled, setCancelled] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setAvailability('idle')
      setAvailabilityReason('')
      return
    }

    setAvailability('checking')
    setAvailabilityReason('')

    try {
      const response = await fetch(
        `/api/provisioning/check-subdomain?subdomain=${encodeURIComponent(value)}`,
      )
      const data = await response.json()

      if (data.available) {
        setAvailability('available')
        setAvailabilityReason('')
      } else {
        setAvailability('unavailable')
        setAvailabilityReason(data.reason || 'This subdomain is not available.')
      }
    } catch {
      setAvailability('idle')
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (subdomain.length >= 3) {
      debounceRef.current = setTimeout(() => {
        checkAvailability(subdomain)
      }, 400)
    } else {
      setAvailability('idle')
      setAvailabilityReason('')
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [subdomain, checkAvailability])

  useEffect(() => {
    if (isSubmitting) {
      document.body.style.cursor = 'wait'
      return () => {
        document.body.style.cursor = ''
      }
    }
  }, [isSubmitting])

  // Handle cancelled checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('cancelled') === 'true') {
      setCancelled(true)
      window.history.replaceState({}, '', '/signup')
    }
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setError('')
    setIsSubmitting(true)

    try {
      const result = await createSite(formData)
      if (result.success && result.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.checkoutUrl
      } else if (!result.success) {
        setError(result.message)
        setIsSubmitting(false)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="prose dark:prose-invert max-w-none mb-8">
        <h1>Create Your Site</h1>
        <p>
          Choose a plan and subdomain and we&apos;ll set up your own GlossyCMS instance in about a
          minute.
        </p>
      </div>

      {/* Cancelled checkout banner */}
      {cancelled && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Your payment was cancelled. You can try again whenever you&apos;re ready.
          <button
            type="button"
            onClick={() => setCancelled(false)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div ref={topRef} />
        <input type="hidden" name="plan" value={plan} />

        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Plan <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlan('basic')}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                plan === 'basic'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <div className="font-semibold">Basic</div>
              <div className="text-2xl font-bold mt-1">
                $10<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Images only</div>
            </button>
            <button
              type="button"
              onClick={() => setPlan('pro')}
              className={`rounded-lg border-2 p-4 text-left transition-colors ${
                plan === 'pro'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <div className="font-semibold">Pro</div>
              <div className="text-2xl font-bold mt-1">
                $20<span className="text-sm font-normal text-muted-foreground">/mo</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">Images + Audio + Video</div>
            </button>
          </div>
        </div>

        {/* Subdomain */}
        <div>
          <label htmlFor="subdomain" className="block text-sm font-medium mb-2">
            Subdomain <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-0">
            <input
              type="text"
              id="subdomain"
              name="subdomain"
              required
              minLength={3}
              maxLength={63}
              pattern="[a-z0-9]([a-z0-9\-]{1,61}[a-z0-9])?"
              placeholder="your-site"
              value={subdomain}
              onChange={(e) =>
                setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              className="flex-1 rounded-l-md border border-r-0 border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="rounded-r-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              .glossysites.live
            </span>
          </div>
          <div className="mt-1 text-sm min-h-[1.25rem]">
            {availability === 'checking' && (
              <span className="text-muted-foreground">Checking availability...</span>
            )}
            {availability === 'available' && (
              <span className="text-green-600 dark:text-green-400">
                {subdomain}.glossysites.live is available
              </span>
            )}
            {availability === 'unavailable' && (
              <span className="text-red-600 dark:text-red-400">{availabilityReason}</span>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="ownerEmail" className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="ownerEmail"
            name="ownerEmail"
            required
            placeholder="you@example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium mb-2">
            Your name
          </label>
          <input
            type="text"
            id="ownerName"
            name="ownerName"
            placeholder="Jane Doe"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Site Name */}
        <div>
          <label htmlFor="siteName" className="block text-sm font-medium mb-2">
            Site name
          </label>
          <input
            type="text"
            id="siteName"
            name="siteName"
            placeholder="My Awesome Site"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            You can change this later in your site settings.
          </p>
        </div>

        {/* Site Description */}
        <div>
          <label htmlFor="siteDescription" className="block text-sm font-medium mb-2">
            Site description
          </label>
          <textarea
            id="siteDescription"
            name="siteDescription"
            rows={2}
            placeholder="A brief description of your site"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || availability === 'unavailable' || availability === 'checking'}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Redirecting to payment...' : 'Continue to Payment'}
        </button>
      </form>
    </div>
  )
}
