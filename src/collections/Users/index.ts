import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

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
      name: 'headerImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'A header/banner image for your profile.',
      },
    },
    {
      name: 'userImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Your profile picture. Displayed in the admin panel navigation.',
      },
    },
  ],
  timestamps: true,
}
