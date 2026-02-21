'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'
import { SiteBanner, type SiteBannerProps } from '@/components/SiteBanner'

interface HeaderClientProps extends SiteBannerProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  data,
  headerImage,
  userImage,
  siteTitle,
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
      <div className="container py-4 flex items-center justify-between">
        {siteTitle && (
          <Link href="/" className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground font-heading hover:no-underline">
            {siteTitle}
          </Link>
        )}
        <HeaderNav data={data} />
      </div>
      <SiteBanner
        headerImage={headerImage}
        userImage={userImage}
        siteTitle={siteTitle}
      />
    </header>
  )
}
