import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { NewsletterForm } from './NewsletterForm'

async function getSiteOwnerName() {
  const payload = await getPayload({ config: configPromise })
  const users = await payload.find({
    collection: 'users',
    limit: 1,
    sort: 'createdAt',
    depth: 0,
  })
  return users.docs[0]?.siteTitle || null
}

const getCachedSiteOwnerName = () =>
  unstable_cache(async () => getSiteOwnerName(), ['site-owner-name'], {
    tags: ['site-owner'],
  })

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 1)()
  const siteTitle = await getCachedSiteOwnerName()()

  const navItems = footerData?.navItems || []

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
