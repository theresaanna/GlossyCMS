'use client'

import React, { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'

export interface EditLinkProps {
  collection?: string
  id?: string | number
  global?: string
  label?: string
  /** Render as an inline icon button instead of a fixed floating button */
  inline?: boolean
  /** Optional additional class names */
  className?: string
}

export const EditLink: React.FC<EditLinkProps> = ({
  collection,
  id,
  global,
  label,
  inline,
  className,
}) => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${getClientSideURL()}/api/users/me`, {
          credentials: 'include',
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.user?.id) {
            setIsAdmin(true)
          }
        }
      } catch {
        // Not logged in or network error
      }
    }
    checkAuth()
  }, [])

  if (!isAdmin) return null

  let href: string
  let defaultLabel: string

  if (global) {
    href = `/admin/globals/${global}`
    defaultLabel = 'Edit settings'
  } else if (collection && id != null) {
    href = `/admin/collections/${collection}/${id}`
    defaultLabel = collection === 'posts' ? 'Edit this post' : 'Edit this page'
  } else {
    return null
  }

  const displayLabel = label || defaultLabel

  if (inline) {
    return (
      <a
        href={href}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${className || ''}`}
        data-testid="edit-link"
        title={displayLabel}
      >
        <Pencil className="w-3 h-3" />
        {displayLabel}
      </a>
    )
  }

  return (
    <a
      href={href}
      className={`fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors ${className || ''}`}
      data-testid="edit-link"
    >
      <Pencil className="w-3.5 h-3.5" />
      {displayLabel}
    </a>
  )
}
