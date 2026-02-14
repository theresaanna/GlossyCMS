import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'enableNewsletter',
      type: 'checkbox',
      label: 'Enable Newsletter Signup',
      defaultValue: false,
    },
    {
      name: 'newsletterHeading',
      type: 'text',
      defaultValue: 'Stay in the loop',
      admin: {
        condition: (data) => Boolean(data?.enableNewsletter),
      },
    },
    {
      name: 'newsletterDescription',
      type: 'textarea',
      admin: {
        condition: (data) => Boolean(data?.enableNewsletter),
      },
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
          enableGalleryLink: true,
          enablePostsLink: true,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
