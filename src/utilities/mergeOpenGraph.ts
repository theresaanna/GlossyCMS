import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const siteName = process.env.SITE_NAME || 'GlossyCMS'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: process.env.SITE_DESCRIPTION || 'A website powered by GlossyCMS.',
  images: [
    {
      url: `${getServerSideURL()}/website-template-OG.webp`,
    },
  ],
  siteName,
  title: siteName,
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
