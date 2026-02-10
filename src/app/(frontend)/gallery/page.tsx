// src/app/(frontend)/gallery/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import GalleryGrid from '@/components/GalleryGrid'

export default async function GalleryPage() {
  const payload = await getPayload({ config })

  const media = await payload.find({
    collection: 'media',
    limit: 100,
    sort: '-createdAt',
    where: {
      filename: {
        exists: true,
        not_equals: null,
      },
    },
  })

  // Debug: log media items to understand URL population
  media.docs.forEach((item) => {
    console.log(`[Gallery] id=${item.id} mime=${item.mimeType} filename=${item.filename} url=${item.url}`)
  })

  const validMedia = media.docs.filter((item): item is typeof item & { url: string } => {
    return typeof item.url === 'string' && item.url.length > 0
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Gallery</h1>

      {validMedia.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="mt-4 text-lg font-medium text-gray-900">No media yet</h3>
          <p className="mt-2 text-gray-500">Upload images or videos through the admin panel.</p>
        </div>
      ) : (
        <GalleryGrid items={validMedia} />
      )}
    </div>
  )
}
