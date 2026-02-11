'use client'

import React, { useCallback, useState } from 'react'
import { useSelection, toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'

export const BulkSpamButton: React.FC = () => {
  const { count, getSelectedIds, toggleAll } = useSelection()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSpam = useCallback(async () => {
    if (count === 0) return

    const ids = getSelectedIds()

    setIsLoading(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: {
            id: { in: ids },
          },
          data: {
            status: 'spam',
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Marked ${result.docs?.length || ids.length} comment(s) as spam`)
        toggleAll()
        router.refresh()
      } else {
        toast.error('Failed to mark comments as spam')
      }
    } catch {
      toast.error('Failed to mark comments as spam')
    } finally {
      setIsLoading(false)
    }
  }, [count, getSelectedIds, toggleAll, router])

  if (count === 0) return null

  return (
    <button
      type="button"
      className="pill pill--style-light pill--has-action pill--style-warning"
      disabled={isLoading}
      onClick={handleSpam}
    >
      {isLoading ? 'Marking...' : `Spam (${count})`}
    </button>
  )
}

export default BulkSpamButton
