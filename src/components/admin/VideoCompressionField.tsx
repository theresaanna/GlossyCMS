'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useField, useForm } from '@payloadcms/ui'
import { compressVideo, type CompressionProgress } from '@/utilities/clientVideoCompression'
import { extractVideoThumbnailCanvas } from '@/utilities/extractVideoThumbnailCanvas'

const FILE_SIZE_CAP = 250 * 1024 * 1024 // 250MB

const VideoCompressionField: React.FC = () => {
  const { value: fileValue, setValue: setFileValue } = useField<File | null>({ path: 'file' })
  const { setValue: setOriginalSize } = useField<number>({ path: 'originalSize' })
  const { setValue: setCompressionRatio } = useField<number>({ path: 'compressionRatio' })
  const { setValue: setVideoThumbnailURL } = useField<string>({ path: 'videoThumbnailURL' })
  const { setProcessing } = useForm()

  const [progress, setProgress] = useState<CompressionProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const processingRef = useRef(false)
  const processedFilesRef = useRef(new WeakSet<File>())

  const handleCompression = useCallback(
    async (file: File) => {
      if (processingRef.current) return
      if (!file.type.startsWith('video/')) return
      if (processedFilesRef.current.has(file)) return // Already compressed

      processingRef.current = true
      setProcessing(true)
      setError(null)

      try {
        // Use file.slice() to create a clone for compression.
        // Payload's client upload handler streams the original File to Vercel
        // Blob concurrently — slice() creates a lightweight Blob reference
        // without reading the bytes, so both can proceed.
        const compressSource = new File([file.slice()], file.name, { type: file.type })

        // Extract thumbnail using native <video> + <canvas> APIs.
        // This is best-effort — if it fails (CORS, unsupported format, timeout)
        // we log and continue with compression. The upload should never stall
        // because of a thumbnail failure.
        setProgress({ phase: 'loading', percent: 0, message: 'Generating thumbnail...' })
        try {
          const thumbnailFile = await extractVideoThumbnailCanvas(file, {
            timestamp: 1,
            width: 500,
          })

          // Upload thumbnail via API
          const formData = new FormData()
          formData.append('file', thumbnailFile)
          const res = await fetch('/api/video-thumbnail', { method: 'POST', body: formData })
          if (res.ok) {
            const { url } = await res.json()
            setVideoThumbnailURL(url)
          }
        } catch (thumbErr) {
          console.warn('Thumbnail extraction failed (non-blocking):', thumbErr)
        }

        // Skip compression for small files
        if (file.size < 1 * 1024 * 1024) {
          processingRef.current = false
          setProcessing(false)
          setProgress(null)
          return
        }

        // Skip compression for files too large for in-browser WASM processing
        if (file.size > FILE_SIZE_CAP) {
          setError(
            'This file is too large for in-browser compression (max 250MB). We recommend uploading on a laptop or desktop machine for best performance.',
          )
          processingRef.current = false
          setProcessing(false)
          return
        }

        const result = await compressVideo(compressSource, setProgress)

        // Mark the compressed file so we don't re-process it
        processedFilesRef.current.add(result.compressedFile)

        // Update metadata fields
        setOriginalSize(result.originalSize)
        setCompressionRatio(result.compressionRatio)

        // Replace the file in the form with the compressed version
        setFileValue(result.compressedFile)
      } catch (err) {
        console.error('Video compression failed:', err)
        setError(
          `Compression failed: ${err instanceof Error ? err.message : 'Unknown error'}.`,
        )
        setProgress(null)
      } finally {
        processingRef.current = false
        setProcessing(false)
      }
    },
    [setFileValue, setOriginalSize, setCompressionRatio, setVideoThumbnailURL, setProcessing],
  )

  useEffect(() => {
    if (fileValue instanceof File && fileValue.type.startsWith('video/')) {
      handleCompression(fileValue)
    }
  }, [fileValue, handleCompression])

  return (
    <>
      <div
        style={{
          padding: '12px 16px',
          margin: '8px 0',
          borderRadius: '4px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          fontSize: '13px',
          color: '#6b7280',
        }}
      >
        Videos up to 250MB can be compressed in-browser. We recommend uploading on a laptop or
        desktop machine for best performance.
      </div>

      {(progress || error) && (
        <div
          style={{
            padding: '12px 16px',
            margin: '8px 0',
            borderRadius: '4px',
            backgroundColor: error
              ? '#fef2f2'
              : progress?.phase === 'done'
                ? '#f0fdf4'
                : '#eff6ff',
            border: `1px solid ${error ? '#fecaca' : progress?.phase === 'done' ? '#bbf7d0' : '#bfdbfe'}`,
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            {error ? 'Compression Error' : 'Video Compression'}
          </div>

          {error && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>{error}</div>
          )}

          {progress && !error && (
            <>
              <div style={{ fontSize: '13px', marginTop: '4px', color: '#374151' }}>
                {progress.message}
              </div>

              {progress.phase !== 'done' && (
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#dbeafe',
                    borderRadius: '3px',
                    marginTop: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress.percent}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}

export default VideoCompressionField
