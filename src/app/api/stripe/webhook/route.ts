import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { getStripe } from '@/utilities/stripe'
import { updateVercelEnvVars, triggerVercelDeploy, getVercelProject } from '@/utilities/vercel-api'

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

  const payload = await getPayload({ config: configPromise })

  switch (event.type) {
    case 'checkout.session.completed': {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, payload)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionSuspend(subscription.id, 'subscription deleted', payload)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId =
        invoice.parent?.subscription_details?.subscription
          ? typeof invoice.parent.subscription_details.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : invoice.parent.subscription_details.subscription.id
          : null
      if (subscriptionId) {
        await handleSubscriptionSuspend(subscriptionId, 'payment failed', payload)
      }
      break
    }

    case 'customer.subscription.updated': {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, payload)
      break
    }
  }

  return NextResponse.json({ received: true })
}

async function findSiteBySubscriptionId(subscriptionId: string, payload: Payload) {
  const result = await payload.find({
    collection: 'provisioned-sites',
    overrideAccess: true,
    where: {
      stripeSubscriptionId: { equals: subscriptionId },
    },
    limit: 1,
  })
  return result.docs[0] ?? null
}

function resolvePlanFromPriceId(priceId: string): 'basic' | 'pro' | null {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) return 'basic'
  return null
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, payload: Payload) {
  const siteId = session.metadata?.siteId
  if (!siteId) {
    console.error('Webhook: checkout.session.completed missing siteId metadata')
    return
  }

  const site = await payload.findByID({
    collection: 'provisioned-sites',
    id: Number(siteId),
    overrideAccess: true,
  })

  if (!site) {
    console.error(`Webhook: site ${siteId} not found`)
    return
  }

  if (site.status !== 'pending_payment') {
    // Already processed — idempotency guard
    console.log(`Webhook: site ${siteId} already in status ${site.status}, skipping`)
    return
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

  // Queue provisioning job — it will be picked up by the status polling
  // endpoint so the webhook can respond to Stripe immediately.
  await payload.jobs.queue({
    task: 'provision-site',
    input: { siteId: Number(siteId) },
  })
}

async function handleSubscriptionSuspend(
  subscriptionId: string,
  reason: string,
  payload: Payload,
) {
  const site = await findSiteBySubscriptionId(subscriptionId, payload)
  if (!site) {
    console.log(`Webhook: no site found for subscription ${subscriptionId}`)
    return
  }

  if (site.status !== 'active') {
    console.log(
      `Webhook: site ${site.id} already in status ${site.status}, skipping suspend (${reason})`,
    )
    return
  }

  await payload.update({
    collection: 'provisioned-sites',
    id: site.id,
    overrideAccess: true,
    data: { status: 'suspended' },
  })

  console.log(`Webhook: suspended site ${site.id} (${site.subdomain}) — ${reason}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, payload: Payload) {
  const site = await findSiteBySubscriptionId(subscription.id, payload)
  if (!site) {
    console.log(`Webhook: no site found for subscription ${subscription.id}`)
    return
  }

  // Handle status changes
  const suspendStatuses = ['past_due', 'unpaid', 'canceled']
  if (suspendStatuses.includes(subscription.status) && site.status === 'active') {
    await payload.update({
      collection: 'provisioned-sites',
      id: site.id,
      overrideAccess: true,
      data: { status: 'suspended' },
    })
    console.log(
      `Webhook: suspended site ${site.id} (${site.subdomain}) — subscription status: ${subscription.status}`,
    )
    return
  }

  if (subscription.status === 'active' && site.status === 'suspended') {
    await payload.update({
      collection: 'provisioned-sites',
      id: site.id,
      overrideAccess: true,
      data: { status: 'active' },
    })
    console.log(`Webhook: restored site ${site.id} (${site.subdomain}) to active`)
  }

  // Handle plan changes
  const currentPriceId = subscription.items.data[0]?.price?.id
  if (!currentPriceId) return

  const newPlan = resolvePlanFromPriceId(currentPriceId)
  if (!newPlan || newPlan === site.plan) return

  const oldPlan = site.plan
  await payload.update({
    collection: 'provisioned-sites',
    id: site.id,
    overrideAccess: true,
    data: { plan: newPlan },
  })

  console.log(
    `Webhook: plan changed for site ${site.id} (${site.subdomain}): ${oldPlan} → ${newPlan}`,
  )

  // Update Vercel env vars and redeploy
  if (site.vercelProjectId) {
    try {
      await updateVercelEnvVars(site.vercelProjectId, {
        SITE_PLAN: newPlan,
        NEXT_PUBLIC_SITE_PLAN: newPlan,
      })

      const project = await getVercelProject(site.vercelProjectId)
      await triggerVercelDeploy(site.vercelProjectId, project.link?.repoId)

      console.log(`Webhook: triggered redeploy for site ${site.id} with plan ${newPlan}`)
    } catch (error) {
      console.error(`Webhook: failed to update Vercel for site ${site.id}:`, error)
    }
  }

  // On downgrade from Pro to Basic, delete audio/video media
  if (oldPlan === 'pro' && newPlan === 'basic') {
    const domain = `${site.subdomain}.glossysites.live`
    const siteApiKey = site.siteApiKey

    if (siteApiKey) {
      try {
        const response = await fetch(`https://${domain}/api/media-cleanup`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${siteApiKey}` },
        })

        if (response.ok) {
          const result = await response.json()
          console.log(
            `Webhook: media cleanup for site ${site.id} — deleted ${result.deleted} files`,
          )
        } else {
          console.error(
            `Webhook: media cleanup failed for site ${site.id} — ${response.status}`,
          )
        }
      } catch (error) {
        console.error(`Webhook: media cleanup request failed for site ${site.id}:`, error)
      }
    }
  }
}
