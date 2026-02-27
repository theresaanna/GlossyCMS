import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { isAdmin } from '../../access/isAdmin'

export const USER_ROLES = ['admin', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: isAdmin,
    delete: isAdmin,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Viewer', value: 'viewer' },
      ],
      access: {
        update: isAdmin,
      },
      admin: {
        description: 'Admins have full access. Viewers can only view content in the admin panel.',
      },
    },
  ],
  timestamps: true,
}
