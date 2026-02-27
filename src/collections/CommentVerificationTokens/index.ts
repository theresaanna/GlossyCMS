import type { CollectionConfig } from 'payload'

import { isAdmin } from '../../access/isAdmin'

export const CommentVerificationTokens: CollectionConfig = {
  slug: 'comment-verification-tokens',
  access: {
    create: () => false, // Only created programmatically
    read: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  timestamps: true,
}
