import type { Block } from 'payload'

import { socialPlatforms } from './platforms'

export const SocialMedia: Block = {
  slug: 'socialMedia',
  interfaceName: 'SocialMediaBlock',
  labels: {
    singular: 'Social Media',
    plural: 'Social Media',
  },
  fields: [
    {
      name: 'platforms',
      type: 'array',
      label: 'Social Media Links',
      labels: {
        singular: 'Social Link',
        plural: 'Social Links',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            ...socialPlatforms.map((p) => ({
              label: p.label,
              value: p.value,
            })),
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'username',
          type: 'text',
          required: true,
          admin: {
            condition: (_data, siblingData) => {
              return Boolean(siblingData?.platform) && siblingData?.platform !== 'other'
            },
            description: 'Enter your username (without the @ symbol or full URL)',
          },
        },
        {
          name: 'customLabel',
          type: 'text',
          label: 'Label',
          required: true,
          admin: {
            condition: (_data, siblingData) => siblingData?.platform === 'other',
            description: 'Display name for this link',
          },
        },
        {
          name: 'customUrl',
          type: 'text',
          label: 'URL',
          required: true,
          admin: {
            condition: (_data, siblingData) => siblingData?.platform === 'other',
            description: 'Full URL (e.g. https://example.com/username)',
          },
        },
      ],
    },
  ],
}
