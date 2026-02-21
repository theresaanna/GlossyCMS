import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { revalidateMedia, revalidateMediaDelete } from './hooks/revalidateMedia'
import { canUploadMediaType, PLAN_UPLOAD_ERROR } from '../../utilities/plan'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['filename', 'filesize', 'createdAt', '_parentFolder'],
    components: {
      beforeListTable: ['@/components/admin/MediaUploadStatusBanner'],
    },
  },
  fields: [
    {
      name: 'uploadProgress',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/UploadProgressField',
        },
      },
    },
    {
      name: 'videoCompressor',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/VideoCompressionField',
        },
      },
    },
    {
      name: 'audioCompressor',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/AudioCompressionField',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'isExternalVideo',
      type: 'checkbox',
      admin: {
        description: 'This file is stored on Vercel Blob (for large videos)',
        readOnly: true,
      },
    },
    {
      name: 'originalSize',
      type: 'number',
      admin: {
        description: 'Original file size before compression (bytes)',
        readOnly: true,
      },
    },
    {
      name: 'compressionRatio',
      type: 'number',
      admin: {
        description: 'Compression ratio achieved',
        readOnly: true,
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        description: 'Video duration in seconds',
        readOnly: true,
      },
    },
    {
      name: 'videoThumbnailURL',
      type: 'text',
      admin: {
        description: 'Auto-generated thumbnail URL for video files',
        readOnly: true,
      },
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        const mimeType = req.file?.mimetype || data?.mimeType || ''

        if (mimeType && !canUploadMediaType(mimeType)) {
          const { APIError } = await import('payload')
          throw new APIError(PLAN_UPLOAD_ERROR, 403)
        }

        return data
      },
      async ({ data, req, operation }) => {
        // Video compression and thumbnail extraction are handled client-side
        // via @ffmpeg/ffmpeg WASM. This hook ensures metadata fallbacks are set.
        if (operation === 'create' && req.file && req.file.mimetype?.startsWith('video/')) {
          console.log(
            `Video upload received: ${req.file.name} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`,
          )

          if (!data.originalSize) {
            data.originalSize = req.file.size
          }
        }

        if (operation === 'create' && req.file && req.file.mimetype?.startsWith('audio/')) {
          console.log(
            `Audio upload received: ${req.file.name} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`,
          )

          if (!data.originalSize) {
            data.originalSize = req.file.size
          }
        }

        return data
      },
    ],
    afterChange: [revalidateMedia],
    afterDelete: [revalidateMediaDelete],
    beforeDelete: [
      async ({ req, id }) => {
        try {
          const payload = req.payload
          const media = (await payload.findByID({
            collection: 'media',
            id,
          })) as any

          if (media?.isExternalVideo && media?.url) {
            console.log(`Would delete from Blob: ${media.url}`)
            // Uncomment to enable deletion:
            // const { del } = await import('@vercel/blob')
            // await del(media.url, { token: process.env.BLOB_READ_WRITE_TOKEN })
          }
        } catch (error) {
          console.error('Error deleting from Blob:', error)
        }

        return true
      },
    ],
  },
}
