import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { AgeGateProvider, AgeGateModal } from '@/plugins/ageGate'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { draftMode } from 'next/headers'
import themeConfig from '@/theme.config'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const { SiteLayout } = themeConfig.layouts

  const adultContent = await getCachedGlobal('adult-content')()

  const ageGateOptions = {
    enabled: Boolean(adultContent?.enableAgeVerification),
    minimumAge: adultContent?.minimumAge ?? 18,
    redirectUrl: adultContent?.redirectUrl ?? '',
  }

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
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

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
