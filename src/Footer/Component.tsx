import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer, SiteSetting } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { NewsletterForm } from './NewsletterForm'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()
  const siteSettings: SiteSetting = await getCachedGlobal('site-settings', 0)()

  const navItems = footerData?.navItems || []
  const siteTitle = siteSettings?.siteTitle || null

  return (
    <footer className="mt-auto border-t border-border bg-primary dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link href="/" className="font-playwrite italic text-2xl">
          {siteTitle || 'Home'}
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>

      {footerData?.enableNewsletter && (
        <div className="container pb-8">
          <div className="border-t border-white/20 pt-6">
            <NewsletterForm
              heading={footerData.newsletterHeading}
              description={footerData.newsletterDescription}
            />
          </div>
        </div>
      )}
    </footer>
  )
}
