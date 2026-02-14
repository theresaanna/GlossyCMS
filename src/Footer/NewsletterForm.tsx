'use client'

import React, { useState } from 'react'
import { getClientSideURL } from '@/utilities/getURL'

type Props = {
  heading?: string | null
  description?: string | null
}

export const NewsletterForm: React.FC<Props> = ({ heading, description }) => {
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
    <div>
      {heading && <h4 className="text-lg font-semibold mb-1">{heading}</h4>}
      {description && <p className="text-sm text-white/70 mb-3">{description}</p>}

      {status === 'success' ? (
        <p className="text-green-400 text-sm font-medium">Thank you for subscribing!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/50 text-sm focus:outline-none focus:border-white/50"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-white/90 disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && errorMessage && (
        <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
      )}
    </div>
  )
}
