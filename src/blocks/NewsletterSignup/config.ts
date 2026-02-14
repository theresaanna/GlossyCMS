import type { Block } from 'payload'

export const NewsletterSignup: Block = {
  slug: 'newsletterSignup',
  interfaceName: 'NewsletterSignupBlock',
  labels: {
    singular: 'Newsletter Signup',
    plural: 'Newsletter Signups',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Subscribe to our newsletter',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'successMessage',
      type: 'text',
      defaultValue: 'Thank you for subscribing!',
    },
  ],
}
