import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const PRIMARY_URL =
  process.env.NEXT_PUBLIC_PRIMARY_URL || 'https://www.glossysites.live'

/**
 * Proxy endpoint on provisioned sites that changes the subscription plan
 * by calling the primary instance.
 *
 * Requires an authenticated Payload admin user (JWT cookie).
 */
export async function POST(req: NextRequest): Promise<Response> {
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

  let plan: string
  try {
    const body = await req.json()
    plan = body.plan
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (plan !== 'basic' && plan !== 'pro') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const response = await fetch(`${PRIMARY_URL}/api/stripe/change-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${siteApiKey}`,
      },
      body: JSON.stringify({ plan }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.error('Change plan request failed:', response.status, data)
      return NextResponse.json(
        { error: data.error || 'Failed to change plan' },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Change plan proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to billing service' },
      { status: 502 },
    )
  }
}
