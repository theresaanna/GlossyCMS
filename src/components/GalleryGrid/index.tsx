// src/components/GalleryGrid.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Media } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type MediaWithUrl = Media & { url: string }

const isVideo = (item: MediaWithUrl) => item.mimeType?.startsWith('video/')
const isAudio = (item: MediaWithUrl) => item.mimeType?.startsWith('audio/')

export default function GalleryGrid({ items }: { items: MediaWithUrl[] }) {
  const [selectedItem, setSelectedItem] = useState<MediaWithUrl | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedItem(item)}
            className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 group cursor-pointer"
          >
            {isAudio(item) ? (
              <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center gap-3 p-4">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="text-gray-300 text-xs text-center truncate w-full">
                  {item.alt || item.filename || 'Audio'}
                </span>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio
                  controls
                  className="w-full max-w-[200px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src={getMediaUrl(item.url)} />
                </audio>
              </div>
            ) : isVideo(item) && item.videoThumbnailURL ? (
              <Image
                src={item.videoThumbnailURL}
                alt={item.alt || item.filename || 'Video thumbnail'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : isVideo(item) ? (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Video</span>
              </div>
            ) : (
              <Image
                src={item.url}
                alt={item.alt || item.filename || 'Gallery image'}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}

            {/* Play icon overlay for videos */}
            {isVideo(item) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors">
                  <svg
                    className="w-5 h-5 text-white ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {item.alt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {item.alt}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
            onClick={() => setSelectedItem(null)}
          >
            &times;
          </button>
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isAudio(selectedItem) ? (
              <div className="flex flex-col items-center gap-6">
                <svg
                  className="w-16 h-16 text-white/70"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
                <span className="text-white text-lg">
                  {selectedItem.alt || selectedItem.filename || 'Audio'}
                </span>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio controls autoPlay className="w-full max-w-lg">
                  <source src={getMediaUrl(selectedItem.url)} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : isVideo(selectedItem) ? (
              <video
                src={getMediaUrl(selectedItem.url)}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
                poster={selectedItem.videoThumbnailURL || undefined}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <Image
                src={selectedItem.url}
                alt={selectedItem.alt || selectedItem.filename || 'Gallery image'}
                fill
                className="object-contain"
                sizes="100vw"
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
