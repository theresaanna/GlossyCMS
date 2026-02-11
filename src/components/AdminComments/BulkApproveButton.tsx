'use client'

import React, { useCallback, useState } from 'react'
import { useSelection, toast } from '@payloadcms/ui'
import { useRouter } from 'next/navigation.js'

export const BulkApproveButton: React.FC = () => {
  const { count, getSelectedIds, toggleAll } = useSelection()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleApprove = useCallback(async () => {
    if (count === 0) return

    const ids = getSelectedIds()

    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      ids.forEach((id) => params.append('where[id][in][]', String(id)))

      const response = await fetch(`/api/comments?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Approved ${result.docs?.length || ids.length} comment(s)`)
        toggleAll()
        router.refresh()
      } else {
        toast.error('Failed to approve comments')
      }
    } catch {
      toast.error('Failed to approve comments')
    } finally {
      setIsLoading(false)
    }
  }, [count, getSelectedIds, toggleAll, router])

  if (count === 0) return null

  return (
    <button
      type="button"
      className="pill pill--style-light pill--has-action"
      disabled={isLoading}
      onClick={handleApprove}
    >
      {isLoading ? 'Approving...' : `Approve (${count})`}
    </button>
  )
}

export default BulkApproveButton
