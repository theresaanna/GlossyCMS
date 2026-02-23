import { getPayload, Where } from 'payload'
import config from '@payload-config'
import GalleryGrid from '@/components/GalleryGrid'
import { EditLink } from '@/components/EditLink'
import themeConfig from '@/theme.config'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { GallerySetting } from '@/payload-types'

export default async function GalleryPage() {
  const payload = await getPayload({ config })

  const gallerySettings = (await getCachedGlobal('gallery-settings', 1)()) as GallerySetting

  const folderId = gallerySettings?.folder
    ? typeof gallerySettings.folder === 'object'
      ? gallerySettings.folder.id
      : gallerySettings.folder
    : null

  const limit = gallerySettings?.limit || 100
  const title = gallerySettings?.title || 'Gallery'

  const where: Where = {}
  if (folderId) {
    where.folder = { equals: folderId }
  }

  const media = await payload.find({
    collection: 'media',
    limit,
    sort: '-createdAt',
    where,
  })

  // Include items that have a url OR a filename (fallback for videos)
  const validMedia = media.docs
    .filter((item) => {
      return (typeof item.url === 'string' && item.url.length > 0) ||
        (typeof item.filename === 'string' && item.filename.length > 0)
    })
    .map((item) => ({
      ...item,
      url: item.url || `/api/media/file/${item.filename}`,
    })) as (typeof media.docs[number] & { url: string })[]

  const { GalleryLayout } = themeConfig.layouts

  return (
    <GalleryLayout>
      <EditLink global="gallery-settings" label="Edit gallery settings" />
      <h1 className="text-xl md:text-2xl lg:text-3xl font-heading mb-8">{title}</h1>

      {validMedia.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="mt-4 text-lg font-medium text-gray-900">No media yet</h3>
          <p className="mt-2 text-gray-500">Upload images or videos through the admin panel.</p>
        </div>
      ) : (
        <GalleryGrid items={validMedia} />
      )}
    </GalleryLayout>
  )
}
