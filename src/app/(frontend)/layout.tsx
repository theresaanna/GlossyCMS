import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { Google_Sans, Lexend } from 'next/font/google'
import React from 'react'

const googleSans = Google_Sans({
  subsets: ['latin'],
  variable: '--font-google-sans',
})

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { AgeGateProvider, AgeGateModal } from '@/plugins/ageGate'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { AdultContent as AdultContentType, SiteSetting } from '@/payload-types'
import { draftMode } from 'next/headers'
import themeConfig from '@/theme.config'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const { SiteLayout } = themeConfig.layouts

  const adultContent: AdultContentType = await getCachedGlobal('adult-content')()
  const siteSettings: SiteSetting = await getCachedGlobal('site-settings')()

  const colorSchemeLight = siteSettings?.colorSchemeLight ?? 'default'
  const colorSchemeDark = siteSettings?.colorSchemeDark ?? 'default'

  const ageGateOptions = {
    enabled: Boolean(adultContent?.enableAgeVerification),
    minimumAge: adultContent?.minimumAge ?? 18,
    redirectUrl: adultContent?.redirectUrl ?? '',
  }

  return (
    <html
      className={cn(googleSans.variable, lexend.variable)}
      data-color-scheme-light={colorSchemeLight}
      data-color-scheme-dark={colorSchemeDark}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <AgeGateProvider options={ageGateOptions}>
            <AgeGateModal />
            <SiteLayout
              adminBar={
                <AdminBar
                  adminBarProps={{
                    preview: isEnabled,
                  }}
                />
              }
              header={<Header />}
              footer={<Footer />}
            >
              {children}
            </SiteLayout>
          </AgeGateProvider>
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await getSiteMetaDefaults()

  return {
    metadataBase: new URL(getServerSideURL()),
    openGraph: mergeOpenGraph(undefined, defaults),
    twitter: {
      card: 'summary_large_image',
      creator: process.env.TWITTER_HANDLE || '',
    },
  }
}
