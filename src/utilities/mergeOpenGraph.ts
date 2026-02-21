import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'
import type { SiteMetaDefaults } from './getSiteMetaDefaults'

const DEFAULT_SITE_NAME = 'Glossy'
const DEFAULT_DESCRIPTION = 'A website powered by Glossy.'

const getDefaultOpenGraph = (defaults?: SiteMetaDefaults): Metadata['openGraph'] => ({
  type: 'website',
  description: defaults?.siteDescription || process.env.SITE_DESCRIPTION || DEFAULT_DESCRIPTION,
  images: [
    {
      url: defaults?.ogImageUrl || `${getServerSideURL()}/website-template-OG.webp`,
    },
  ],
  siteName: defaults?.siteName || process.env.SITE_NAME || DEFAULT_SITE_NAME,
  title: defaults?.siteName || process.env.SITE_NAME || DEFAULT_SITE_NAME,
})

export const mergeOpenGraph = (
  og?: Metadata['openGraph'],
  defaults?: SiteMetaDefaults,
): Metadata['openGraph'] => {
  const defaultOpenGraph = getDefaultOpenGraph(defaults)
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
