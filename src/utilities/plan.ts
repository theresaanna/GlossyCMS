export type SitePlan = 'basic' | 'pro'

export function getSitePlan(): SitePlan {
  const plan = process.env.SITE_PLAN
  if (plan === 'pro') return 'pro'
  return 'basic'
}

export function canUploadMediaType(mimeType: string): boolean {
  const plan = getSitePlan()

  if (plan === 'pro') return true

  // Basic plan: only images allowed
  if (mimeType.startsWith('image/')) return true

  return false
}

export const PLAN_UPLOAD_ERROR =
  'Audio and video uploads require the Pro plan. Please upgrade to upload this file type.'
