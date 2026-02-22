import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getStripe } from '@/utilities/stripe'

/**
 * Creates a Stripe Customer Portal session for a provisioned site.
 * Called by provisioned sites using their SITE_API_KEY for authentication.
 * Only available on the primary instance.
 */
export async function POST(req: NextRequest): Promise<Response> {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = authHeader.slice(7)

  const payload = await getPayload({ config: configPromise })

  // Find the provisioned site by its API key
  const result = await payload.find({
    collection: 'provisioned-sites',
    overrideAccess: true,
    where: {
      siteApiKey: { equals: apiKey },
    },
    limit: 1,
  })

  const site = result.docs[0]
  if (!site) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!site.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  let returnUrl: string | undefined
  try {
    const body = await req.json()
    returnUrl = body.returnUrl
  } catch {
    // No body or invalid JSON is fine — returnUrl is optional
  }

  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: site.stripeCustomerId,
    ...(returnUrl ? { return_url: returnUrl } : {}),
  })

  return NextResponse.json({ url: session.url })
}
