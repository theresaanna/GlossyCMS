import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

interface AdminAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
    userImage?: number | { url?: string; sizes?: { thumbnail?: { url?: string } } } | null
  } | null
  [key: string]: unknown
}

/**
 * Custom admin avatar component (server component).
 *
 * Payload passes `user` via serverProps when rendering the avatar through
 * RenderServerComponent in the DefaultTemplate. The user object is at depth 0,
 * so `userImage` is a numeric media ID. We fetch the media document server-side
 * to resolve the image URL.
 */
const AdminAvatar: React.FC<AdminAvatarProps> = async ({ user }) => {
  let imageUrl: string | null = null

  if (user?.userImage) {
    if (typeof user.userImage === 'object') {
      // Already populated
      imageUrl =
        user.userImage.sizes?.thumbnail?.url || user.userImage.url || null
    } else if (typeof user.userImage === 'number') {
      // Numeric ID — fetch server-side
      try {
        const payload = await getPayload({ config: configPromise })
        const media = await payload.findByID({
          collection: 'media',
          id: user.userImage,
          depth: 0,
        })
        if (media) {
          const sizes = media.sizes as
            | { thumbnail?: { url?: string } }
            | undefined
          imageUrl = sizes?.thumbnail?.url || media.url || null
        }
      } catch {
        // Silently fail — will show initial fallback
      }
    }
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={user?.name || user?.email || 'User avatar'}
        style={{
          width: 25,
          height: 25,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    )
  }

  // Fallback: show the user's first initial in a circle
  const initial = (
    user?.name?.[0] || user?.email?.[0] || 'U'
  ).toUpperCase()

  return (
    <span
      style={{
        width: 25,
        height: 25,
        borderRadius: '50%',
        backgroundColor: 'var(--color-base-500)',
        color: 'var(--color-base-0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  )
}

export default AdminAvatar
