import { NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_MAX_LENGTH,
} from '@/collections/ProvisionedSites/constants'

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX_REQUESTS
}

export async function GET(request: Request): Promise<Response> {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { available: false, reason: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

  const { searchParams } = new URL(request.url)
  const subdomain = searchParams.get('subdomain')?.toLowerCase().trim()

  if (!subdomain) {
    return NextResponse.json(
      { available: false, reason: 'Subdomain is required.' },
      { status: 400 },
    )
  }

  // Format validation
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH || subdomain.length > SUBDOMAIN_MAX_LENGTH) {
    return NextResponse.json({
      available: false,
      reason: `Subdomain must be between ${SUBDOMAIN_MIN_LENGTH} and ${SUBDOMAIN_MAX_LENGTH} characters.`,
    })
  }

  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    return NextResponse.json({
      available: false,
      reason:
        'Subdomain can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.',
    })
  }

  // Reserved words check
  if ((RESERVED_SUBDOMAINS as readonly string[]).includes(subdomain)) {
    return NextResponse.json({
      available: false,
      reason: 'This subdomain is reserved.',
    })
  }

  // Database uniqueness check
  const payload = await getPayload({ config: configPromise })
  const existing = await payload.find({
    collection: 'provisioned-sites',
    overrideAccess: true,
    where: {
      subdomain: { equals: subdomain },
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    return NextResponse.json({
      available: false,
      reason: 'This subdomain is already taken.',
    })
  }

  return NextResponse.json({ available: true })
}
