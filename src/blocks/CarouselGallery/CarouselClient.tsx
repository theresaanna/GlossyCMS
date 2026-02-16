'use client'

import React from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules'
import type { Media } from '@/payload-types'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

type MediaWithUrl = Media & { url: string }

interface CarouselClientProps {
  items: MediaWithUrl[]
  autoplay: boolean
  autoplayDelay: number
  loop: boolean
  slidesPerView: number
}

export function CarouselClient({
  items,
  autoplay,
  autoplayDelay,
  loop,
  slidesPerView,
}: CarouselClientProps) {
  const breakpoints: Record<number, { slidesPerView: number; spaceBetween: number }> = {}

  if (slidesPerView >= 2) {
    breakpoints[640] = { slidesPerView: 2, spaceBetween: 16 }
  }
  if (slidesPerView >= 3) {
    breakpoints[1024] = { slidesPerView: 3, spaceBetween: 24 }
  }
  if (slidesPerView >= 4) {
    breakpoints[1280] = { slidesPerView: slidesPerView, spaceBetween: 24 }
  }

  const modules = [Navigation, Pagination, A11y]
  if (autoplay) {
    modules.push(Autoplay)
  }

  return (
    <Swiper
      modules={modules}
      spaceBetween={slidesPerView > 1 ? 16 : 0}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      loop={loop && items.length > slidesPerView}
      autoplay={
        autoplay
          ? { delay: autoplayDelay, disableOnInteraction: true, pauseOnMouseEnter: true }
          : false
      }
      breakpoints={Object.keys(breakpoints).length > 0 ? breakpoints : undefined}
      className="w-full"
    >
      {items.map((item) => (
        <SwiperSlide key={item.id}>
          <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-gray-100" style={{ height: '60vh' }}>
            <Image
              src={item.url}
              alt={item.alt || item.filename || 'Carousel image'}
              fill
              className="object-contain"
              sizes={
                slidesPerView === 1
                  ? '100vw'
                  : `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.round(100 / slidesPerView)}vw`
              }
            />
            {item.alt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-4 text-sm">
                {item.alt}
              </div>
            )}
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
