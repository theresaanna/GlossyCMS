'use client'

import React, { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'

export interface EditLinkProps {
  collection?: string
  id?: string | number
  global?: string
  label?: string
}

export const EditLink: React.FC<EditLinkProps> = ({ collection, id, global, label }) => {
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

  return (
    <a
      href={href}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
      data-testid="edit-link"
    >
      <Pencil className="w-3.5 h-3.5" />
      {label || defaultLabel}
    </a>
  )
}
