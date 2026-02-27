import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { isAdmin } from '../../access/isAdmin'
import { setSubscriptionDates } from './hooks/setSubscriptionDates'

export const NewsletterRecipients: CollectionConfig = {
  slug: 'newsletter-recipients',
  access: {
    create: anyone,
    read: authenticated,
    update: isAdmin,
    delete: isAdmin,
  },
  defaultSort: '-createdAt',
  admin: {
    defaultColumns: ['email', 'name', 'status', 'subscribedAt'],
    listSearchableFields: ['email', 'name'],
    useAsTitle: 'email',
    components: {
      beforeListTable: [
        '@/collections/NewsletterRecipients/ui/ComposeNewsletterButton',
      ],
    },
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'subscribed',
      options: [
        { label: 'Subscribed', value: 'subscribed' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'subscribedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.status === 'unsubscribed',
      },
    },
  ],
  hooks: {
    beforeChange: [setSubscriptionDates],
  },
  timestamps: true,
}
