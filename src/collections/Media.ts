import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { put } from '@vercel/blob'
import { compressVideo, getVideoMetadata } from '../utilities/videoCompression'

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
        // Only handle video uploads on create
        if (operation === 'create' && req.file && req.file.mimetype?.startsWith('video/')) {
          const file = req.file
          const originalSize = file.size

          try {
            console.log(`Processing video: ${file.name} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`)

            // Get video metadata
            const metadata = await getVideoMetadata(file.data)

            // Compress video
            const compressedBuffer = await compressVideo(file.data, {
              maxWidth: 1920,
              maxHeight: 1080,
              videoBitrate: '1500k',
              audioBitrate: '128k',
              fps: 30,
              crf: 23,
            })

            const compressedSize = compressedBuffer.length
            const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2)

            console.log(
              `Compressed from ${(originalSize / 1024 / 1024).toFixed(2)}MB to ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${compressionRatio}% reduction)`
            )

            // Update file data with compressed version
            file.data = compressedBuffer
            file.size = compressedSize

            // Store metadata
            data.originalSize = originalSize
            data.compressionRatio = parseFloat(compressionRatio)
            data.duration = metadata.duration
            data.width = metadata.width
            data.height = metadata.height

            // Check if still too large for serverless after compression
            const sizeLimit = 4.5 * 1024 * 1024 // 4.5MB

            if (compressedSize > sizeLimit) {
              console.log('Compressed video still too large, uploading to Vercel Blob...')

              // Generate unique filename
              const timestamp = Date.now()
              const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
              const filename = `${timestamp}-${safeFilename}`

              // Upload to Vercel Blob
              const blob = await put(filename, compressedBuffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN!,
                contentType: 'video/mp4',
              })

              console.log(`Successfully uploaded to Blob: ${blob.url}`)

              // Update data with Blob URL
              data.url = blob.url
              data.filename = safeFilename
              data.mimeType = 'video/mp4'
              data.filesize = compressedSize
              data.isExternalVideo = true

              // Prevent Payload from saving the file locally
              delete req.file
            }
          } catch (error) {
            console.error('Video processing error:', error)
            throw new Error(
              `Failed to process video file: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
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
