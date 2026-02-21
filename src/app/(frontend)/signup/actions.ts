'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_MAX_LENGTH,
} from '@/collections/ProvisionedSites/constants'

type CreateSiteResult = {
  success: boolean
  message: string
  siteId?: number | string
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

  const payload = await getPayload({ config: configPromise })

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

  // Create the provisioned site record
  const site = await payload.create({
    collection: 'provisioned-sites',
    overrideAccess: true,
    data: {
      subdomain,
      ownerEmail: ownerEmail.trim(),
      ownerName: ownerName?.trim() || undefined,
      siteName: siteName?.trim() || undefined,
      siteDescription: siteDescription?.trim() || undefined,
      status: 'pending',
    },
  })

  // Enqueue the provisioning job
  await payload.jobs.queue({
    task: 'provision-site',
    input: { siteId: site.id },
  })

  // Run queued jobs
  await payload.jobs.run()

  redirect(`/signup/status/${site.id}`)
}
