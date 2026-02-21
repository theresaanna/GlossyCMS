import type { Block } from 'payload'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'size',
      type: 'select',
      defaultValue: 'full',
      options: [
        {
          label: 'Small',
          value: 'small',
        },
        {
          label: 'Medium',
          value: 'medium',
        },
        {
          label: 'Large',
          value: 'large',
        },
        {
          label: 'Full Width',
          value: 'full',
        },
      ],
    },
  ],
}
