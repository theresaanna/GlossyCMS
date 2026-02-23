import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getMeUser } from '@/utilities/getMeUser'
import { EditLink } from '@/components/EditLink'
import React from 'react'

import type { Header, SiteSetting } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 1)()
  const siteSettings: SiteSetting = await getCachedGlobal('site-settings', 1)()

  let isAdmin = false
  try {
    const { user } = await getMeUser()
    isAdmin = !!user
  } catch {
    // Not logged in
  }

  return (
    <div className="relative">
      <HeaderClient
        data={headerData}
        headerImage={siteSettings?.headerImage ?? null}
        userImage={siteSettings?.userImage ?? null}
        siteTitle={siteSettings?.siteTitle ?? null}
        isAdmin={isAdmin}
      />
      <EditLink global="header" label="Edit header" inline />
    </div>
  )
}
