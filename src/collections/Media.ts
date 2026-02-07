import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { put } from '@vercel/blob'

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
      name: 'alt',
      type: 'text',
      //required: true,
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
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
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
        // Only handle video uploads on create
        if (operation === 'create' && req.file && req.file.mimetype?.startsWith('video/')) {
          const file = req.file

          // Check if file is too large for serverless (4.5MB limit)
          const sizeLimit = 4.5 * 1024 * 1024 // 4.5MB

          if (file.size > sizeLimit) {
            try {
              // Generate unique filename
              const timestamp = Date.now()
              const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
              const filename = `${timestamp}-${safeFilename}`

              console.log(`Uploading large video (${(file.size / 1024 / 1024).toFixed(2)}MB) to Vercel Blob...`)

              // Upload to Vercel Blob
              const blob = await put(filename, file.data, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN!,
                contentType: file.mimetype,
              })

              console.log(`Successfully uploaded to Blob: ${blob.url}`)

              // Update data with Blob URL
              data.url = blob.url
              data.filename = safeFilename
              data.mimeType = file.mimetype
              data.filesize = file.size
              data.isExternalVideo = true

              // Prevent Payload from saving the file locally
              delete req.file
            } catch (error) {
              console.error('Blob upload error:', error)
              throw new Error(
                `Failed to upload large video file: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            }
          }
        }

        return data
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        // Optional: Delete from Vercel Blob when deleting from Payload
        try {
          const payload = req.payload
          const media = await payload.findByID({
            collection: 'media',
            id,
          })

          if (media.isExternalVideo && media.url) {
            // Extract blob URL and delete
            // Note: You'll need to use @vercel/blob's del function
            // const { del } = await import('@vercel/blob')
            // await del(media.url, { token: process.env.BLOB_READ_WRITE_TOKEN })
            console.log(`Would delete from Blob: ${media.url}`)
          }
        } catch (error) {
          console.error('Error deleting from Blob:', error)
          // Don't throw - allow Payload deletion to continue
        }

        return true
      },
    ],
  },
}
