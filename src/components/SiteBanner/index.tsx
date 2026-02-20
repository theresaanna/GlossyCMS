import React from 'react'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export interface SiteBannerMedia {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  updatedAt?: string
  sizes?: {
    thumbnail?: { url?: string | null } | null
    square?: { url?: string | null } | null
    small?: { url?: string | null } | null
    medium?: { url?: string | null } | null
    large?: { url?: string | null } | null
    xlarge?: { url?: string | null } | null
  } | null
}

export interface SiteBannerProps {
  headerImage?: SiteBannerMedia | number | null
  userImage?: SiteBannerMedia | number | null
  siteTitle?: string | null
}

/**
 * SiteBanner renders the header banner image with an overlaid circular avatar
 * and a site title beneath it. Replaces the hardcoded "Glossy" logo.
 */
export const SiteBanner: React.FC<SiteBannerProps> = ({
  headerImage,
  userImage,
  siteTitle,
}) => {
  const headerMedia = typeof headerImage === 'object' ? headerImage : null
  const avatarMedia = typeof userImage === 'object' ? userImage : null

  const bannerUrl = headerMedia
    ? getMediaUrl(
        headerMedia.sizes?.xlarge?.url || headerMedia.sizes?.large?.url || headerMedia.url,
        headerMedia.updatedAt,
      )
    : null

  const avatarUrl = avatarMedia
    ? getMediaUrl(
        avatarMedia.sizes?.square?.url || avatarMedia.sizes?.small?.url || avatarMedia.url,
        avatarMedia.updatedAt,
      )
    : null

  return (
    <div className="w-full" data-testid="site-banner">
      {/* Banner image */}
      <div className="relative w-full h-48 md:h-64 lg:h-80 bg-muted overflow-hidden">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={headerMedia?.alt || 'Site banner'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
      </div>

      {/* Avatar + title area */}
      <div className="container relative">
        <div className="flex items-end gap-4 -mt-12 md:-mt-16">
          {/* Avatar circle */}
          <div className="relative shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-muted overflow-hidden shadow-lg">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={avatarMedia?.alt || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-semibold text-primary/60">
                  {siteTitle?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
