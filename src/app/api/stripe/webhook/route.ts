import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getStripe } from '@/utilities/stripe'

export async function POST(req: NextRequest): Promise<Response> {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const siteId = session.metadata?.siteId
    if (!siteId) {
      console.error('Webhook: checkout.session.completed missing siteId metadata')
      return NextResponse.json({ received: true })
    }

    const payload = await getPayload({ config: configPromise })

    const site = await payload.findByID({
      collection: 'provisioned-sites',
      id: Number(siteId),
      overrideAccess: true,
    })

    if (!site) {
      console.error(`Webhook: site ${siteId} not found`)
      return NextResponse.json({ received: true })
    }

    if (site.status !== 'pending_payment') {
      // Already processed — idempotency guard
      console.log(`Webhook: site ${siteId} already in status ${site.status}, skipping`)
      return NextResponse.json({ received: true })
    }

    // Update record with Stripe data and transition to pending
    await payload.update({
      collection: 'provisioned-sites',
      id: Number(siteId),
      overrideAccess: true,
      data: {
        status: 'pending',
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
    })

    // Queue provisioning job and start it without blocking the webhook response.
    // The status page polls /api/provisioning/status/[id] to track progress.
    await payload.jobs.queue({
      task: 'provision-site',
      input: { siteId: Number(siteId) },
    })

    payload.jobs.run().catch((err) => {
      console.error('Provisioning job failed:', err)
    })
  }

  return NextResponse.json({ received: true })
}
