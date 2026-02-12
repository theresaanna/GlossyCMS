import type { Block } from 'payload'

export const TwitterFeed: Block = {
  slug: 'twitterFeed',
  interfaceName: 'TwitterFeedBlock',
  labels: {
    plural: 'Twitter Feeds',
    singular: 'Twitter Feed',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Section Title',
      admin: {
        description: 'Optional heading displayed above the tweet feed.',
      },
    },
    {
      name: 'twitterUsername',
      type: 'text',
      required: true,
      label: 'Twitter/X Username',
      admin: {
        description: 'The username (without @) whose tweets to display.',
      },
    },
    {
      name: 'numberOfTweets',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 20,
      label: 'Number of Tweets',
      admin: {
        step: 1,
        description: 'How many recent tweets to show (1–20).',
      },
    },
  ],
}
