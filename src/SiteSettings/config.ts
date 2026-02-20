import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { colorSchemes } from '@/colorSchemes'
import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'

const colorSchemeOptions = colorSchemes.map(({ value, label }) => ({ value, label }))

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
    {
      type: 'row',
      fields: [
        {
          name: 'colorSchemeLight',
          type: 'select',
          label: 'Light Color Scheme',
          defaultValue: 'default',
          options: colorSchemeOptions,
          admin: {
            description: 'The color scheme used when the site is in light mode.',
            width: '50%',
          },
        },
        {
          name: 'colorSchemeDark',
          type: 'select',
          label: 'Dark Color Scheme',
          defaultValue: 'default',
          options: colorSchemeOptions,
          admin: {
            description: 'The color scheme used when the site is in dark mode.',
            width: '50%',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}
