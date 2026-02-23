import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import themeConfig from '@/theme.config'
import { EditLink } from '@/components/EditLink'

export const dynamic = 'force-static'
export const revalidate = 600

export default async function Page() {
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      publishedAt: true,
    },
  })

  const { ArchiveLayout } = themeConfig.layouts

  return (
    <ArchiveLayout>
      <PageClient />
      <div className="container mb-8">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-heading">Posts</h1>
        <EditLink collection="posts" label="Draft a new post" inline />
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </ArchiveLayout>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `${siteName} Posts`,
  }
}
