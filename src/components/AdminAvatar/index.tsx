'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'

/**
 * Custom admin avatar component that displays the user's uploaded profile image
 * in the admin panel navigation (top-right corner). Falls back to the user's
 * first initial when no image is uploaded.
 */
const AdminAvatar: React.FC = () => {
  const { user } = useAuth()

  const userImage = user?.userImage as
    | { url?: string; sizes?: { thumbnail?: { url?: string } } }
    | undefined

  const imageUrl = userImage?.sizes?.thumbnail?.url || userImage?.url

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
