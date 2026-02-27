import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { isAdmin } from '../../access/isAdmin'
import { sendNewsletterHandler } from './endpoints/sendNewsletter'

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  access: {
    create: isAdmin,
    read: authenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  defaultSort: '-createdAt',
  admin: {
    defaultColumns: ['subject', 'status', 'sentAt', 'recipientCount'],
    useAsTitle: 'subject',
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
        ],
      }),
    },
    {
      name: 'recipients',
      type: 'relationship',
      relationTo: 'newsletter-recipients',
      hasMany: true,
      admin: {
        description:
          'Select specific recipients. If none are selected, the newsletter will be sent to all subscribed recipients.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'recipientCount',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'sendAction',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/collections/Newsletters/ui/SendNewsletterButton',
        },
      },
    },
  ],
  endpoints: [
    {
      path: '/:id/send',
      method: 'post',
      handler: sendNewsletterHandler,
    },
  ],
  timestamps: true,
}
