import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { type ColorSchemeMode, colorSchemes } from '@/colorSchemes'
import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'

const hasMode = (modes: readonly ColorSchemeMode[], mode: ColorSchemeMode) => modes.includes(mode)

const lightColorSchemeOptions = colorSchemes
  .filter(({ modes }) => hasMode(modes, 'light'))
  .map(({ value, label }) => ({ value, label }))

const darkColorSchemeOptions = colorSchemes
  .filter(({ modes }) => hasMode(modes, 'dark'))
  .map(({ value, label }) => ({ value, label }))

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true,
    update: isAdmin,
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
      name: 'siteDescription',
      type: 'textarea',
      admin: {
        description: 'A short description of your site used in search results and social previews.',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Default image used for social media previews when no page-specific image is set.',
      },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Custom favicon for your site. Recommended: square image, at least 32x32px. Supports ICO, PNG, or SVG.',
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
          options: lightColorSchemeOptions,
          admin: {
            width: '50%',
            components: {
              Field: '@/components/admin/ColorSchemeSelectLight',
            },
          },
        },
        {
          name: 'colorSchemeDark',
          type: 'select',
          label: 'Dark Color Scheme',
          defaultValue: 'default',
          options: darkColorSchemeOptions,
          admin: {
            width: '50%',
            components: {
              Field: '@/components/admin/ColorSchemeSelectDark',
            },
          },
        },
      ],
    },
    {
      name: 'colorSchemeReloader',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/ReloadOnColorSchemeChange',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}
