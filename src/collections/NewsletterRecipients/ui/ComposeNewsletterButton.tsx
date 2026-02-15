'use client'

import React, { useCallback, useState } from 'react'
import { useSelection, toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'

export const ComposeNewsletterButton: React.FC = () => {
  const { count, getSelectedIds } = useSelection()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCompose = useCallback(async () => {
    if (count === 0) return

    const ids = getSelectedIds()

    setIsLoading(true)
    try {
      const response = await fetch(`/api/newsletters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Untitled Newsletter',
          recipients: ids.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id)),
        }),
      })

      if (response.ok || response.status === 201) {
        const data = await response.json()
        const newsletterId = data.doc?.id
        if (newsletterId) {
          toast.success(`Draft created with ${ids.length} recipient${ids.length !== 1 ? 's' : ''}`)
          router.push(`/admin/collections/newsletters/${newsletterId}`)
        } else {
          toast.error('Failed to create newsletter draft')
        }
      } else {
        toast.error('Failed to create newsletter draft')
      }
    } catch {
      toast.error('Failed to create newsletter draft')
    } finally {
      setIsLoading(false)
    }
  }, [count, getSelectedIds, router])

  if (count === 0) return null

  return (
    <button
      type="button"
      className="pill pill--style-light pill--has-action"
      disabled={isLoading}
      onClick={handleCompose}
    >
      {isLoading ? 'Creating...' : `Compose Newsletter (${count})`}
    </button>
  )
}

export default ComposeNewsletterButton
