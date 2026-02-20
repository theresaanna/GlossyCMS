'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

/**
 * Resolves the avatar image URL from the user's userImage field.
 * The auth user from useAuth() is returned at depth 0, so userImage
 * is typically just a numeric media ID. This hook fetches the media
 * document to get the actual image URL.
 */
function useAvatarUrl(userImage: unknown): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    // Already a populated object with a URL
    if (userImage && typeof userImage === 'object') {
      const media = userImage as {
        url?: string
        sizes?: { thumbnail?: { url?: string } }
      }
      setUrl(media.sizes?.thumbnail?.url || media.url || null)
      return
    }

    // It's a numeric ID — fetch the media document
    if (typeof userImage === 'number') {
      fetch(`/api/media/${userImage}`)
        .then((res) => {
          if (!res.ok) return null
          return res.json()
        })
        .then((media) => {
          if (media) {
            setUrl(media.sizes?.thumbnail?.url || media.url || null)
          }
        })
        .catch(() => {
          // Silently fail — will show initial fallback
        })
      return
    }

    setUrl(null)
  }, [userImage])

  return url
}

/**
 * Custom admin avatar component that displays the user's uploaded profile image
 * in the admin panel navigation (top-right corner). Falls back to the user's
 * first initial when no image is uploaded.
 */
const AdminAvatar: React.FC = () => {
  const { user } = useAuth()
  const imageUrl = useAvatarUrl(user?.userImage)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={user?.name || user?.email || 'User avatar'}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    )
  }

  // Fallback: show the user's first initial in a circle
  const initial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        backgroundColor: 'var(--color-base-500)',
        color: 'var(--color-base-0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8rem',
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  )
}

export default AdminAvatar
