import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { teardownProvisionedSite } from './hooks/teardownProvisionedSite'
import { validateSubdomain } from './hooks/validateSubdomain'

export const ProvisionedSites: CollectionConfig = {
  slug: 'provisioned-sites',
  access: {
    create: anyone,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: '-createdAt',
  admin: {
    defaultColumns: ['subdomain', 'ownerEmail', 'status', 'provisionedAt'],
    listSearchableFields: ['subdomain', 'ownerEmail'],
    useAsTitle: 'subdomain',
  },
  fields: [
    {
      name: 'subdomain',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'ownerEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'ownerName',
      type: 'text',
    },
    {
      name: 'siteName',
      type: 'text',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Provisioning', value: 'provisioning' },
        { label: 'Active', value: 'active' },
        { label: 'Failed', value: 'failed' },
        { label: 'Suspended', value: 'suspended' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'vercelProjectId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'postgresStoreId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'blobStoreId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'provisioningError',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.status === 'failed',
      },
    },
    {
      name: 'provisionedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.status === 'active',
      },
    },
  ],
  hooks: {
    afterDelete: [teardownProvisionedSite],
    beforeValidate: [validateSubdomain],
  },
  timestamps: true,
}
