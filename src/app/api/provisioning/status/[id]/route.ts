import { NextResponse } from 'next/server'
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

    // If the site is in "pending" status, ensure a job is queued then run it.
    // This handles both the normal Stripe flow (job already queued by webhook)
    // and admin-created records (no job queued yet).
    if (site.status === 'pending') {
      await payload.jobs.queue({
        task: 'provision-site',
        input: { siteId: numericId },
      })
      await payload.jobs.run()

      // Re-fetch after the job ran so the response reflects the new status
      const updated = await payload.findByID({
        collection: 'provisioned-sites',
        id: numericId,
        overrideAccess: true,
      })

      return NextResponse.json({
        status: updated.status,
        subdomain: updated.subdomain,
        provisioningError: updated.status === 'failed' ? updated.provisioningError : undefined,
        provisionedAt: updated.provisionedAt,
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
