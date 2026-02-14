import type { GlobalConfig } from 'payload'

import { revalidateGallery } from './hooks/revalidateGallery'

export const Gallery: GlobalConfig = {
  slug: 'gallery-settings',
  label: 'Gallery',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Gallery Page Title',
      defaultValue: 'Gallery',
      admin: {
        description: 'The title displayed at the top of the gallery page',
      },
    },
    {
      name: 'folder',
      type: 'relationship',
      relationTo: 'payload-folders',
      label: 'Media Folder',
      admin: {
        description:
          'Select a media folder to populate the gallery page. If no folder is selected, all media will be shown.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 100,
      label: 'Maximum Items',
      min: 1,
      max: 500,
      admin: {
        step: 1,
        description: 'Maximum number of media items to display',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGallery],
  },
}
