import type { Block } from 'payload'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: {
    plural: 'Galleries',
    singular: 'Gallery',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Gallery Title',
      admin: {
        description: 'Optional title displayed above the gallery',
      },
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'folder',
      options: [
        {
          label: 'Media Folder',
          value: 'folder',
        },
        {
          label: 'Individual Selection',
          value: 'selection',
        },
      ],
    },
    {
      name: 'folder',
      type: 'relationship',
      relationTo: 'payload-folders',
      label: 'Media Folder',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'folder',
        description: 'Select a media folder. All images in this folder will be displayed.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 50,
      label: 'Limit',
      min: 1,
      max: 200,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'folder',
        step: 1,
      },
    },
    {
      name: 'selectedMedia',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      label: 'Select Images',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
        description: 'Choose individual media items for the gallery.',
      },
    },
  ],
}
