import type { GalleryBlock as GalleryBlockProps, Media } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import GalleryGrid from '@/components/GalleryGrid'

type MediaWithUrl = Media & { url: string }

export const GalleryBlock: React.FC<
  GalleryBlockProps & {
    id?: string
    disableInnerContainer?: boolean
  }
> = async (props) => {
  const { id, title, populateBy, folder, limit: limitFromProps, selectedMedia } = props

  const limit = limitFromProps || 50

  let mediaItems: MediaWithUrl[] = []

  if (populateBy === 'folder') {
    if (folder) {
      const folderId = typeof folder === 'object' ? folder.id : folder
      const payload = await getPayload({ config: configPromise })

      const result = await payload.find({
        collection: 'media',
        where: {
          folder: { equals: folderId },
          mimeType: { like: 'image/%' },
        },
        limit,
        depth: 0,
      })

      mediaItems = result.docs.filter(
        (doc): doc is MediaWithUrl => typeof doc.url === 'string' && doc.url.length > 0,
      )
    }
  } else {
    if (selectedMedia?.length) {
      const populated = selectedMedia
        .map((item) => {
          if (typeof item === 'object') return item
          return null
        })
        .filter((item): item is Media => item !== null)

      mediaItems = populated.filter(
        (item): item is MediaWithUrl =>
          typeof item.url === 'string' &&
          item.url.length > 0 &&
          typeof item.mimeType === 'string' &&
          item.mimeType.startsWith('image/'),
      )
    }
  }

  if (mediaItems.length === 0) {
    return null
  }

  return (
    <div className="container" id={`block-${id}`}>
      {title && <h2 className="mb-8 text-3xl font-bold">{title}</h2>}
      <GalleryGrid items={mediaItems} />
    </div>
  )
}
