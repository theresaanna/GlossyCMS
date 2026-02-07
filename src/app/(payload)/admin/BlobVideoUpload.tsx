// src/components/admin/BlobVideoUpload.tsx
'use client'

import { useField } from '@payloadcms/ui'
import { useState } from 'react'
import { put } from '@vercel/blob'

export default function BlobVideoUpload({ path }: { path: string }) {
  const { value, setValue } = useField<string>({ path })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // Upload to Vercel Blob
      const blob = await put(file.name, file, {
        access: 'public',
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN!,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          )
          setProgress(percentCompleted)
        },
      })

      // Set the URL in Payload
      setValue(blob.url)

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="field-type">
      <label className="field-label">Video Upload</label>

      <input
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={uploading}
        className="file-input"
      />

      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{progress}%</span>
        </div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {value && (
        <div className="preview">
          <video src={value} controls style={{ maxWidth: '100%', marginTop: '1rem' }} />
          <p className="field-description">URL: {value}</p>
        </div>
      )}
    </div>
  )
}
