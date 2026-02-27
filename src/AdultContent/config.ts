import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { revalidateAdultContent } from './hooks/revalidateAdultContent'

export const AdultContent: GlobalConfig = {
  slug: 'adult-content',
  label: 'Adult Content',
  admin: {
    description: 'Configure age verification for your site.',
  },
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'enableAgeVerification',
      type: 'checkbox',
      label: 'Enable Age Verification',
      defaultValue: false,
      admin: {
        description:
          'When enabled, visitors must confirm they are at least the required age before viewing the site. This check appears once per browser session.',
      },
    },
    {
      name: 'minimumAge',
      type: 'number',
      label: 'Minimum Age',
      defaultValue: 18,
      min: 1,
      max: 99,
      admin: {
        step: 1,
        description: 'The minimum age a visitor must be to access the site.',
        condition: (data) => Boolean(data?.enableAgeVerification),
      },
    },
    {
      name: 'redirectUrl',
      type: 'text',
      label: 'Decline Redirect URL',
      admin: {
        description:
          'If a visitor declines the age check, redirect them to this URL. Leave blank to keep the modal open.',
        condition: (data) => Boolean(data?.enableAgeVerification),
      },
    },
  ],
  hooks: {
    afterChange: [revalidateAdultContent],
  },
}
