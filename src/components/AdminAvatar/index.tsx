import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

interface AdminAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
  } | null
  [key: string]: unknown
}

/**
 * Custom admin avatar component (server component).
 *
 * Fetches the userImage from the site-settings global, since the profile
 * picture is a site-level setting rather than per-user.
 */
const AdminAvatar: React.FC<AdminAvatarProps> = async ({ user }) => {
  let imageUrl: string | null = null

  try {
    const payload = await getPayload({ config: configPromise })
    const siteSettings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 1,
    })

    const userImage = siteSettings?.userImage
    if (userImage && typeof userImage === 'object') {
      const sizes = userImage.sizes as { thumbnail?: { url?: string } } | undefined
      imageUrl = sizes?.thumbnail?.url || userImage.url || null
    }
  } catch {
    // Silently fail — will show initial fallback
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
