import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'siteTitle',
      type: 'text',
      admin: {
        description: 'The title displayed on your site beneath the banner.',
      },
    },
    {
      name: 'headerImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'A header/banner image for your site.',
      },
    },
    {
      name: 'userImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Your profile picture. Displayed in the admin panel navigation and on the site banner.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}
