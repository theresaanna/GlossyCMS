import type { Block } from 'payload'

export const TwitterBlock: Block = {
  slug: 'twitter',
  interfaceName: 'TwitterBlock',
  labels: {
    plural: 'Twitter Embeds',
    singular: 'Twitter Embed',
  },
  fields: [
    {
      name: 'username',
      type: 'text',
      required: true,
      label: 'Twitter Username',
      validate: (value) => {
        if (!value) return 'Username is required'
        if (!/^[A-Za-z0-9_]{1,15}$/.test(value)) {
          return 'Username must be 1-15 characters and contain only letters, numbers, and underscores'
        }
        return true
      },
      admin: {
        description: 'The Twitter/X username (without the @ symbol)',
        placeholder: 'username',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        description: 'Optional title displayed above the Twitter feed',
      },
    },
    {
      name: 'tweetLimit',
      type: 'number',
      defaultValue: 10,
      label: 'Tweet Limit',
      min: 1,
      max: 20,
      admin: {
        step: 1,
        description: 'Maximum number of tweets to display (1-20)',
      },
    },
  ],
}
