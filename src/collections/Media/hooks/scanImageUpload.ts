import type { CollectionBeforeChangeHook } from 'payload'
import { scanImageForCSAM } from '@/utilities/hive-moderation'

export const scanImageUpload: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== 'create') return data
  if (!req.file) return data

  const mimeType = req.file.mimetype || ''
  if (!mimeType.startsWith('image/')) return data

  const buffer = req.file.data as Buffer
  if (!buffer || buffer.length === 0) return data

  const result = await scanImageForCSAM(buffer, req.file.name || 'upload')

  if (result === null) {
    console.warn('[CSAM Scan] Arachnid Shield credentials are not configured — skipping scan')
    return data
  }

  console.log(
    `[CSAM Scan] file="${req.file.name}" scanned=${result.scanned} flagged=${result.flagged} classification=${result.classification}`,
  )

  if (result.flagged) {
    const { APIError } = await import('payload')
    throw new APIError('This image cannot be uploaded because it violates our content policy.', 400)
  }

  if (!result.scanned) {
    console.error(`[CSAM Scan] API unavailable: ${result.error}`)
    const { APIError } = await import('payload')
    throw new APIError('Image upload is temporarily unavailable. Please try again later.', 503)
  }

  return data
}
