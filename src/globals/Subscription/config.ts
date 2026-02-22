import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

export const Subscription: GlobalConfig = {
  slug: 'subscription',
  label: 'Subscription',
  access: {
    read: authenticated,
  },
  admin: {
    components: {
      views: {
        edit: {
          root: {
            Component: '@/components/admin/SubscriptionView',
          },
        },
      },
    },
  },
  fields: [],
}
