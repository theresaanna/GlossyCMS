'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const SendNewsletterButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo()
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; sentCount?: number; error?: string } | null>(null)

  const isSent = initialData?.status === 'sent'
  const recipients = initialData?.recipients as (number | { id: number; email?: string })[] | null | undefined
  const recipientCount = Array.isArray(recipients) ? recipients.length : 0

  const handleSend = useCallback(async () => {
    if (!id) return

    const targetDesc = recipientCount > 0
      ? `${recipientCount} selected recipient${recipientCount !== 1 ? 's' : ''}`
      : 'all subscribed recipients'

    const confirmed = window.confirm(
      `Are you sure you want to send this newsletter to ${targetDesc}? This action cannot be undone.`,
    )
    if (!confirmed) return

    setSending(true)
    setResult(null)

    try {
      const res = await fetch(`/api/newsletters/${id}/send`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, sentCount: data.sentCount })
      } else {
        setResult({ error: data.error || 'Failed to send' })
      }
    } catch {
      setResult({ error: 'Network error' })
    } finally {
      setSending(false)
    }
  }, [id, recipientCount])

  if (isSent) {
    return (
      <div style={{ padding: '12px 0' }}>
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Newsletter sent
          {initialData?.sentAt && (
            <span style={{ fontWeight: 400, marginLeft: '4px' }}>
              on {new Date(initialData.sentAt as string).toLocaleDateString()}
            </span>
          )}
          {initialData?.recipientCount != null && (
            <span style={{ fontWeight: 400, marginLeft: '4px' }}>
              to {initialData.recipientCount} recipient{initialData.recipientCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 0' }}>
      {recipientCount > 0 && (
        <div
          style={{
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          Targeting {recipientCount} selected recipient{recipientCount !== 1 ? 's' : ''}
        </div>
      )}
      {recipientCount === 0 && (
        <div
          style={{
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: '#f5f5f4',
            color: '#57534e',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          Will send to all subscribed recipients
        </div>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !id}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: sending ? '#9ca3af' : '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: sending ? 'not-allowed' : 'pointer',
        }}
      >
        {sending ? 'Sending...' : 'Send Newsletter'}
      </button>

      {result?.success && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          Sent to {result.sentCount} recipient{result.sentCount !== 1 ? 's' : ''}. Refresh to see updated status.
        </div>
      )}

      {result?.error && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          {result.error}
        </div>
      )}
    </div>
  )
}

export default SendNewsletterButton
