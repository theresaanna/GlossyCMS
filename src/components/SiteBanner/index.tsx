import React from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
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
  isAdmin?: boolean
}

/**
 * SiteBanner renders the header banner image with an overlaid circular avatar
 * and a site title beneath it. Replaces the hardcoded "Glossy" logo.
 */
export const SiteBanner: React.FC<SiteBannerProps> = ({
  headerImage,
  userImage,
  siteTitle,
  isAdmin,
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
        {isAdmin && (
          <Link
            href="/admin/globals/site-settings"
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm shadow border border-border/50 hover:bg-background transition-colors group"
            data-testid="banner-settings-icon"
          >
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        )}
      </div>

      {/* Avatar + title area */}
      <div className="container relative">
        <div className="flex items-end gap-4 -mt-12 md:-mt-16">
          {/* Avatar circle */}
          <Link href={isAdmin ? '/admin/globals/site-settings' : '/'} className="relative shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-muted shadow-lg block group">
            <div className="w-full h-full rounded-full overflow-hidden">
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
            {isAdmin && (
              <span className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full bg-background shadow border border-border" data-testid="admin-settings-icon">
                <Settings className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
