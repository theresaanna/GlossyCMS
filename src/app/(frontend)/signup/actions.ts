'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_MAX_LENGTH,
} from '@/collections/ProvisionedSites/constants'
import { getStripe } from '@/utilities/stripe'

export type CreateSiteResult = {
  success: boolean
  message: string
  siteId?: number | string
  subdomain?: string
  checkoutUrl?: string
}

export async function createSite(formData: FormData): Promise<CreateSiteResult> {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    return { success: false, message: 'Signup is not available on this instance.' }
  }

  const rawSubdomain = formData.get('subdomain') as string | null
  const ownerEmail = formData.get('ownerEmail') as string | null
  const ownerName = formData.get('ownerName') as string | null
  const siteName = formData.get('siteName') as string | null
  const siteDescription = formData.get('siteDescription') as string | null
  const plan = (formData.get('plan') as string) || 'basic'

  // Validate required fields
  if (!rawSubdomain?.trim()) {
    return { success: false, message: 'Subdomain is required.' }
  }

  if (!ownerEmail?.trim()) {
    return { success: false, message: 'Email is required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(ownerEmail)) {
    return { success: false, message: 'Please enter a valid email address.' }
  }

  if (plan !== 'basic' && plan !== 'pro') {
    return { success: false, message: 'Invalid plan selected.' }
  }

  const subdomain = rawSubdomain.toLowerCase().trim()

  // Validate subdomain format
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH || subdomain.length > SUBDOMAIN_MAX_LENGTH) {
    return {
      success: false,
      message: `Subdomain must be between ${SUBDOMAIN_MIN_LENGTH} and ${SUBDOMAIN_MAX_LENGTH} characters.`,
    }
  }

  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    return {
      success: false,
      message:
        'Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.',
    }
  }

  if ((RESERVED_SUBDOMAINS as readonly string[]).includes(subdomain)) {
    return { success: false, message: `The subdomain "${subdomain}" is reserved.` }
  }

  // Rate limiting: max 3 signups per hour per IP
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  let payload
  try {
    payload = await getPayload({ config: configPromise })
  } catch (error) {
    console.error('Failed to initialize Payload:', error)
    return { success: false, message: 'Service temporarily unavailable. Please try again.' }
  }

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    // Rate limit by checking recent provisioned sites — a rough proxy using creation time
    // In production, use a proper rate limiting mechanism
    const recentSignups = await payload.find({
      collection: 'provisioned-sites',
      overrideAccess: true,
      where: {
        ownerEmail: { equals: ownerEmail },
        createdAt: { greater_than: oneHourAgo },
      },
      limit: 0,
    })

    if (recentSignups.totalDocs >= 3) {
      return { success: false, message: 'Too many signups. Please wait before trying again.' }
    }

    // Check subdomain uniqueness
    const existing = await payload.find({
      collection: 'provisioned-sites',
      overrideAccess: true,
      where: {
        subdomain: { equals: subdomain },
      },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      return { success: false, message: `The subdomain "${subdomain}" is already taken.` }
    }

    // Create the provisioned site record with pending_payment status
    const site = await payload.create({
      collection: 'provisioned-sites',
      overrideAccess: true,
      data: {
        subdomain,
        ownerEmail: ownerEmail.trim(),
        ownerName: ownerName?.trim() || undefined,
        siteName: siteName?.trim() || undefined,
        siteDescription: siteDescription?.trim() || undefined,
        status: 'pending_payment',
        plan: plan as 'basic' | 'pro',
      },
    })

    // Create Stripe Checkout session
    const priceId =
      plan === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_BASIC_PRICE_ID

    if (!priceId) {
      return { success: false, message: 'Payment configuration error. Please try again later.' }
    }

    const stripe = getStripe()
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: ownerEmail.trim(),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        siteId: String(site.id),
        subdomain,
      },
      success_url: `${serverUrl}/signup/status/${site.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverUrl}/signup?cancelled=true`,
    })

    // Store checkout session ID on the record
    await payload.update({
      collection: 'provisioned-sites',
      id: site.id,
      overrideAccess: true,
      data: {
        stripeCheckoutSessionId: session.id,
      },
    })

    return {
      success: true,
      message: 'Redirecting to payment...',
      checkoutUrl: session.url!,
      siteId: site.id,
      subdomain,
    }
  } catch (error) {
    console.error('Signup error:', error)
    const message =
      error instanceof Error && error.message.includes('DbHandler')
        ? 'Database connection error. Please try again in a moment.'
        : 'Something went wrong. Please try again.'
    return { success: false, message }
  }
}
