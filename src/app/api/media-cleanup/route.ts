import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const AUDIO_VIDEO_QUERY = {
  or: [
    { mimeType: { like: 'audio/%' } },
    { mimeType: { like: 'video/%' } },
  ],
}

/**
 * Deletes all non-image media (audio/video) from this site.
 * Called by the primary instance when a subscription is downgraded from Pro to Basic.
 * Authenticated via SITE_API_KEY.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const apiKey = process.env.SITE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 404 })
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  let deleted = 0
  const pageSize = 100
  let hasMore = true

  while (hasMore) {
    const batch = await payload.find({
      collection: 'media',
      overrideAccess: true,
      where: AUDIO_VIDEO_QUERY,
      limit: pageSize,
      page: 1, // Always page 1 since we're deleting as we go
    })

    if (batch.docs.length === 0) break

    for (const doc of batch.docs) {
      try {
        await payload.delete({
          collection: 'media',
          id: doc.id,
          overrideAccess: true,
        })
        deleted++
      } catch (error) {
        payload.logger.error(`Failed to delete media ${doc.id}: ${error}`)
      }
    }

    hasMore = batch.hasNextPage ?? false
  }

  payload.logger.info(`Media cleanup: deleted ${deleted} audio/video files`)
  return NextResponse.json({ deleted })
}
