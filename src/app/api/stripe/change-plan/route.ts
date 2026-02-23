import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getStripe } from '@/utilities/stripe'

/**
 * Changes the subscription plan for a provisioned site.
 * Called by provisioned sites using their SITE_API_KEY for authentication.
 * Only available on the primary instance.
 *
 * The actual database/Vercel/media-cleanup updates are handled by the
 * `customer.subscription.updated` webhook — this endpoint only tells
 * Stripe to swap the price on the subscription.
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

  let plan: string
  try {
    const body = await req.json()
    plan = body.plan
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (plan !== 'basic' && plan !== 'pro') {
    return NextResponse.json({ error: 'Invalid plan. Must be "basic" or "pro".' }, { status: 400 })
  }

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

  if (!site.stripeSubscriptionId) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
  }

  if (site.plan === plan) {
    return NextResponse.json(
      { error: `Site is already on the ${plan} plan` },
      { status: 400 },
    )
  }

  const priceId = plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_BASIC_PRICE_ID
  if (!priceId) {
    console.error(`change-plan: missing price ID env var for plan "${plan}"`)
    return NextResponse.json({ error: 'Plan pricing is not configured' }, { status: 500 })
  }

  const stripe = getStripe()

  try {
    // Retrieve the current subscription to get the item ID
    const subscription = await stripe.subscriptions.retrieve(site.stripeSubscriptionId)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      console.error(`change-plan: no subscription items found for ${site.stripeSubscriptionId}`)
      return NextResponse.json({ error: 'Subscription has no items' }, { status: 500 })
    }

    // Swap the price — Stripe will fire a customer.subscription.updated webhook
    // which handles all downstream updates (DB, Vercel env, redeploy, media cleanup).
    await stripe.subscriptions.update(site.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: 'create_prorations',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`change-plan: Stripe error for site ${site.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update subscription. Please try again.' },
      { status: 500 },
    )
  }
}
