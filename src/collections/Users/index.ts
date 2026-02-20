import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { revalidateUser } from './hooks/revalidateUser'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
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
        description: 'Your profile picture. Displayed in the admin panel navigation and on the site banner.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateUser],
  },
  timestamps: true,
}
