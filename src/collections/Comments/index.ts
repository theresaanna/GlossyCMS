import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { approvedOrAuthenticated } from '../../access/approvedOrAuthenticated'
import { authenticated } from '../../access/authenticated'
import { notifyCommentRecipients } from './hooks/notifyCommentRecipients'
import { revalidateComment, revalidateCommentDelete } from './hooks/revalidateComment'

export const Comments: CollectionConfig = {
  slug: 'comments',
  access: {
    create: anyone,
    read: approvedOrAuthenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: '-createdAt',
  admin: {
    defaultColumns: ['authorName', 'post', 'status', 'createdAt'],
    listSearchableFields: ['authorName', 'authorEmail', 'body'],
    useAsTitle: 'authorName',
    components: {
      beforeListTable: [
        '@/components/AdminComments/BulkApproveButton',
        '@/components/AdminComments/BulkSpamButton',
      ],
    },
  },
  fields: [
    {
      name: 'authorName',
      type: 'text',
      required: true,
      label: 'Author Name',
    },
    {
      name: 'authorEmail',
      type: 'email',
      required: true,
      label: 'Author Email',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'depth',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Spam', value: 'spam' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        // Auto-compute depth from parent
        if (data?.parent) {
          const parentComment = await req.payload.findByID({
            collection: 'comments',
            id: data.parent,
            overrideAccess: true,
          })
          data.depth = (parentComment.depth || 0) + 1
        } else {
          data.depth = 0
        }

        // Auto-approve if post has moderateComments disabled
        if (data?.post) {
          const postId = typeof data.post === 'object' ? data.post.id : data.post
          const post = await req.payload.findByID({
            collection: 'posts',
            id: postId,
            overrideAccess: true,
          })
          if (post.moderateComments === false) {
            data.status = 'approved'
          }
        }

        return data
      },
    ],
    afterChange: [revalidateComment, notifyCommentRecipients],
    afterDelete: [revalidateCommentDelete],
  },
  timestamps: true,
}
