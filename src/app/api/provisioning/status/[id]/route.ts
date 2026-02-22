import { NextResponse, after } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { id } = await params
  const numericId = Number(id)
  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const site = await payload.findByID({
      collection: 'provisioned-sites',
      id: numericId,
      overrideAccess: true,
    })

    // If the site is in "pending" status, a job has been queued but not yet
    // started. Kick off payload.jobs.run() after responding so the
    // provisioning pipeline executes in this request's lifecycle rather than
    // relying on the webhook (which must return quickly to Stripe).
    if (site.status === 'pending') {
      after(async () => {
        try {
          const p = await getPayload({ config: configPromise })
          await p.jobs.run()
        } catch (err) {
          console.error('Provisioning job run failed:', err)
        }
      })
    }

    // Only expose safe fields publicly
    return NextResponse.json({
      status: site.status,
      subdomain: site.subdomain,
      provisioningError: site.status === 'failed' ? site.provisioningError : undefined,
      provisionedAt: site.provisionedAt,
    })
  } catch {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }
}
