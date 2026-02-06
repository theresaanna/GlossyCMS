// src/app/(frontend)/gallery/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function GalleryPage() {
  const payload = await getPayload({ config })

  const media = await payload.find({
    collection: 'media',
    sort: '-createdAt',
  })

  return (
    <div className="grid grid-cols-3 gap-4">
      {media.docs.map((item) => (
        <img
          key={item.id}
          src={item.url}
          alt={item.alt || ''}
        />
      ))}
    </div>
  )
}
