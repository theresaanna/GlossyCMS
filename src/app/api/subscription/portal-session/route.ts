import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const PRIMARY_URL =
  process.env.NEXT_PUBLIC_PRIMARY_URL || 'https://www.glossysites.live'

/**
 * Proxy endpoint on provisioned sites that creates a Stripe Customer Portal
 * session by calling the primary instance.
 *
 * Requires an authenticated Payload admin user (JWT cookie).
 */
export async function POST(): Promise<Response> {
  const payload = await getPayload({ config: configPromise })

  // Verify the user is authenticated via Payload JWT cookie
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteApiKey = process.env.SITE_API_KEY
  if (!siteApiKey) {
    return NextResponse.json(
      { error: 'Billing is not configured for this site' },
      { status: 500 },
    )
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/admin/globals/subscription`

  try {
    const response = await fetch(`${PRIMARY_URL}/api/stripe/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${siteApiKey}`,
      },
      body: JSON.stringify({ returnUrl }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.error('Portal session creation failed:', response.status, data)
      return NextResponse.json(
        { error: data.error || 'Failed to create portal session' },
        { status: response.status },
      )
    }

    const { url } = await response.json()
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Portal session proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to billing service' },
      { status: 502 },
    )
  }
}
