// src/components/GalleryGrid.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Media } from '@/payload-types'

type MediaWithUrl = Media & { url: string }

export default function GalleryGrid({ items }: { items: MediaWithUrl[] }) {
  const [selectedImage, setSelectedImage] = useState<MediaWithUrl | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedImage(item)}
            className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 group cursor-pointer"
          >
            <Image
              src={item.url}
              alt={item.alt || item.filename || 'Gallery image'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {item.alt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {item.alt}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt || selectedImage.filename || 'Gallery image'}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  )
}
