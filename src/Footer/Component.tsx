import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer, SiteSetting } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { EditLink } from '@/components/EditLink'
import { NewsletterForm } from './NewsletterForm'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()
  const siteSettings: SiteSetting = await getCachedGlobal('site-settings', 0)()

  const navItems = footerData?.navItems || []
  const siteTitle = siteSettings?.siteTitle || null

  return (
    <footer className="mt-auto border-t border-border bg-primary dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link href="/" className="font-heading text-2xl font-semibold">
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

      <div className="flex items-center justify-center gap-3 pb-4">
        <EditLink global="footer" label="Edit footer" inline className="text-white/60 hover:text-white" />
        <span className="text-white/20">·</span>
        <a
          href="https://glossysites.live"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Powered by Glossy
        </a>
        <span className="text-white/20">·</span>
        <a
          href="https://wkf.ms/4qSABHT"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
          aria-label="Report a bug"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M8 2l1.88 1.88" />
            <path d="M14.12 3.88L16 2" />
            <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
            <path d="M12 20v-9" />
            <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
            <path d="M6 13H2" />
            <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
            <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
            <path d="M22 13h-4" />
            <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
          </svg>
          Report a bug
        </a>
      </div>
    </footer>
  )
}
