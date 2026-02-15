import type { Block } from 'payload'

export const CarouselGallery: Block = {
  slug: 'carouselGallery',
  interfaceName: 'CarouselGalleryBlock',
  labels: {
    plural: 'Carousel Galleries',
    singular: 'Carousel Gallery',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Gallery Title',
      admin: {
        description: 'Optional title displayed above the carousel',
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
        description: 'Choose individual media items for the carousel.',
      },
    },
    {
      name: 'autoplay',
      type: 'checkbox',
      defaultValue: false,
      label: 'Autoplay',
      admin: {
        description: 'Automatically advance slides',
      },
    },
    {
      name: 'autoplayDelay',
      type: 'number',
      defaultValue: 3000,
      label: 'Autoplay Delay (ms)',
      min: 1000,
      max: 10000,
      admin: {
        condition: (_, siblingData) => siblingData.autoplay === true,
        step: 500,
        description: 'Time between slide transitions in milliseconds',
      },
    },
    {
      name: 'loop',
      type: 'checkbox',
      defaultValue: true,
      label: 'Loop',
      admin: {
        description: 'Loop back to the first slide after the last',
      },
    },
    {
      name: 'slidesPerView',
      type: 'number',
      defaultValue: 1,
      label: 'Slides Per View',
      min: 1,
      max: 5,
      admin: {
        step: 1,
        description: 'Number of slides visible at once on large screens',
      },
    },
  ],
}
