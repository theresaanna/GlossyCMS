'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  heading?: string | null
  description?: string | null
  successMessage?: string | null
}

export const NewsletterSignupBlock: React.FC<Props> = ({
  heading,
  description,
  successMessage,
}) => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch(`${getClientSideURL()}/api/newsletter-recipients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        const data = await res.json()
        const message = data.errors?.[0]?.message || ''
        if (res.status === 400 && message.toLowerCase().includes('unique')) {
          setErrorMessage('This email is already subscribed.')
        } else {
          setErrorMessage(message || 'Something went wrong. Please try again.')
        }
        setStatus('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="container lg:max-w-[48rem]">
      <div className="p-6 lg:p-8 border border-border rounded-[0.8rem]">
        {heading && <h3 className="text-2xl font-semibold mb-2">{heading}</h3>}
        {description && <p className="text-muted-foreground mb-6">{description}</p>}

        {status === 'success' ? (
          <p className="text-green-600 font-medium">
            {successMessage || 'Thank you for subscribing!'}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="newsletter-email" className="sr-only">
                Email address
              </Label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
              />
            </div>
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        )}

        {status === 'error' && errorMessage && (
          <p className="text-red-600 text-sm mt-3">{errorMessage}</p>
        )}
      </div>
    </div>
  )
}
