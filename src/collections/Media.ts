import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractVideoThumbnail } from '../utilities/videoCompression'
import { writeFile } from 'fs/promises'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

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
  fields: [
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
    staticDir: path.resolve(dirname, '../../public/media'),
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
        // Video compression is handled client-side via @ffmpeg/ffmpeg WASM.
        // This hook ensures metadata fallbacks are set and generates a thumbnail.
        if (operation === 'create' && req.file && req.file.mimetype?.startsWith('video/')) {
          console.log(
            `Video upload received: ${req.file.name} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`,
          )

          if (!data.originalSize) {
            data.originalSize = req.file.size
          }

          // Generate video thumbnail from the uploaded file
          try {
            const thumbnailBuffer = await extractVideoThumbnail(req.file.data, {
              timestamp: '00:00:01',
              width: 500,
            })

            const safeThumbName = req.file.name.replace(/\.[^.]+$/, '.jpg').replace(/[^a-zA-Z0-9.-]/g, '_')
            const thumbFilename = `thumb-${Date.now()}-${safeThumbName}`
            const thumbPath = path.resolve(dirname, '../../public/media', thumbFilename)
            await writeFile(thumbPath, thumbnailBuffer)

            data.videoThumbnailURL = `/media/${thumbFilename}`
            console.log(`Generated video thumbnail: ${thumbFilename}`)
          } catch (thumbError) {
            console.error('Failed to generate video thumbnail:', thumbError)
            // Non-fatal: video will still work without a thumbnail
          }
        }

        return data
      },
    ],
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
