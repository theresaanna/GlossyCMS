'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'
import { SiteBanner, type SiteBannerProps } from '@/components/SiteBanner'
import { EditLink } from '@/components/EditLink'

interface HeaderClientProps extends SiteBannerProps {
  data: Header
  isAdmin?: boolean
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  data,
  headerImage,
  userImage,
  siteTitle,
  isAdmin,
}) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="relative z-20" {...(theme ? { 'data-theme': theme } : {})}>
      <SiteBanner
        headerImage={headerImage}
        userImage={userImage}
        siteTitle={siteTitle}
        isAdmin={isAdmin}
      />
      <div className="container py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
        {siteTitle && (
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-heading hover:no-underline">
              {siteTitle}
            </Link>
            <EditLink global="site-settings" label="Edit site title" inline />
          </div>
        )}
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
