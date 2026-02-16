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
      name: 'header',
      type: 'text',
      label: 'Header',
      admin: {
        description: 'Optional heading displayed above the social media links',
      },
    },
    {
      name: 'customPlatforms',
      type: 'array',
      label: 'Custom Platforms',
      labels: {
        singular: 'Custom Platform',
        plural: 'Custom Platforms',
      },
      admin: {
        initCollapsed: true,
        description: 'Define your own platforms to appear alongside the built-in ones',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Display name for this platform',
          },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Full URL (e.g. https://example.com/username)',
          },
        },
      ],
    },
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
          validate: (value: string | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) => {
            if (Boolean(siblingData?.platform) && siblingData?.platform !== 'other' && !value) {
              return 'This field is required.'
            }
            return true
          },
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
          validate: (value: string | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) => {
            if (siblingData?.platform === 'other' && !value) {
              return 'This field is required.'
            }
            return true
          },
          admin: {
            condition: (_data, siblingData) => siblingData?.platform === 'other',
            description: 'Display name for this link',
          },
        },
        {
          name: 'customUrl',
          type: 'text',
          label: 'URL',
          validate: (value: string | null | undefined, { siblingData }: { siblingData: Record<string, unknown> }) => {
            if (siblingData?.platform === 'other' && !value) {
              return 'This field is required.'
            }
            return true
          },
          admin: {
            condition: (_data, siblingData) => siblingData?.platform === 'other',
            description: 'Full URL (e.g. https://example.com/username)',
          },
        },
      ],
    },
  ],
}
