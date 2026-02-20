import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Header } from '@/payload-types'

async function getSiteOwner() {
  const payload = await getPayload({ config: configPromise })
  const users = await payload.find({
    collection: 'users',
    limit: 1,
    sort: 'createdAt',
    depth: 1,
  })
  return users.docs[0] || null
}

const getCachedSiteOwner = () =>
  unstable_cache(async () => getSiteOwner(), ['site-owner'], {
    tags: ['site-owner'],
  })

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const siteOwner = await getCachedSiteOwner()()

  return (
    <HeaderClient
      data={headerData}
      headerImage={siteOwner?.headerImage ?? null}
      userImage={siteOwner?.userImage ?? null}
      siteTitle={siteOwner?.siteTitle ?? null}
    />
  )
}
