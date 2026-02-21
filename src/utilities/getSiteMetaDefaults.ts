import { getCachedGlobal } from './getGlobals'
import { getServerSideURL } from './getURL'
import type { SiteSetting, Media } from '@/payload-types'

const DEFAULT_SITE_NAME = 'Glossy'
const DEFAULT_DESCRIPTION = 'A website powered by Glossy.'
const DEFAULT_OG_IMAGE_PATH = '/website-template-OG.webp'

export type SiteMetaDefaults = {
  siteName: string
  siteDescription: string
  ogImageUrl: string
}

export const getSiteMetaDefaults = async (): Promise<SiteMetaDefaults> => {
  const serverUrl = getServerSideURL()
  let siteName = process.env.SITE_NAME || DEFAULT_SITE_NAME
  let siteDescription = process.env.SITE_DESCRIPTION || DEFAULT_DESCRIPTION
  let ogImageUrl = `${serverUrl}${DEFAULT_OG_IMAGE_PATH}`

  try {
    const siteSettings: SiteSetting = await getCachedGlobal('site-settings', 1)()

    if (siteSettings?.siteTitle) {
      siteName = siteSettings.siteTitle
    }
    if (siteSettings?.siteDescription) {
      siteDescription = siteSettings.siteDescription
    }
    if (siteSettings?.ogImage && typeof siteSettings.ogImage === 'object') {
      const media = siteSettings.ogImage as Media
      const ogSize = (media.sizes as { og?: { url?: string } })?.og?.url
      ogImageUrl = ogSize ? serverUrl + ogSize : serverUrl + media.url
    }
  } catch {
    // Fall back to env/defaults on error
  }

  return { siteName, siteDescription, ogImageUrl }
}
