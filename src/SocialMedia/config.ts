import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateSocialMedia } from './hooks/revalidateSocialMedia'

export const SocialMedia: GlobalConfig = {
  slug: 'social-media',
  label: 'Social Media',
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'twitterDefaultUsername',
      type: 'text',
      label: 'Default Twitter/X Username',
      admin: {
        description:
          'Default username (without @) to pre-fill when adding Twitter Feed blocks to pages.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateSocialMedia],
  },
}
