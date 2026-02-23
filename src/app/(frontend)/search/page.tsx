import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { CardPostData } from '@/components/Card'
import themeConfig from '@/theme.config'

type Args = {
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: query } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 12,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      doc: true,
      publishedAt: true,
    },
    // pagination: false reduces overhead if you don't need totalDocs
    pagination: false,
    ...(query
      ? {
          where: {
            or: [
              {
                title: {
                  like: query,
                },
              },
              {
                'meta.description': {
                  like: query,
                },
              },
              {
                'meta.title': {
                  like: query,
                },
              },
              {
                slug: {
                  like: query,
                },
              },
            ],
          },
        }
      : {}),
  })

  const { ArchiveLayout } = themeConfig.layouts

  return (
    <ArchiveLayout>
      <PageClient />
      <div className="container mb-8">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading mb-8">Search</h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive
          posts={posts.docs.map((doc) => ({
            ...doc,
            relationTo: doc.doc?.relationTo,
          })) as (CardPostData & { relationTo?: 'posts' | 'pages' })[]}
        />
      ) : (
        <div className="container">No results found.</div>
      )}
    </ArchiveLayout>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `${siteName} Search`,
  }
}
