'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { compressAudio, type CompressionProgress } from '@/utilities/clientAudioCompression'

const COMPRESSION_THRESHOLD = 4.5 * 1024 * 1024 // 4.5MB
const FILE_SIZE_CAP = 250 * 1024 * 1024 // 250MB

const AudioCompressionField: React.FC = () => {
  const { value: fileValue, setValue: setFileValue } = useField<File | null>({ path: 'file' })
  const { setValue: setOriginalSize } = useField<number>({ path: 'originalSize' })
  const { setValue: setCompressionRatio } = useField<number>({ path: 'compressionRatio' })

  const [progress, setProgress] = useState<CompressionProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const processingRef = useRef(false)
  const processedFilesRef = useRef(new WeakSet<File>())

  const handleCompression = useCallback(
    async (file: File) => {
      if (processingRef.current) return
      if (!file.type.startsWith('audio/')) return
      if (processedFilesRef.current.has(file)) return

      if (file.size < COMPRESSION_THRESHOLD) return

      // Skip compression for files too large for in-browser WASM processing
      if (file.size > FILE_SIZE_CAP) {
        setError(
          'This file is too large for in-browser compression (max 250MB). We recommend uploading on a laptop or desktop machine for best performance.',
        )
        return
      }

      processingRef.current = true
      setError(null)

      try {
        const fileClone = new File([await file.arrayBuffer()], file.name, {
          type: file.type,
        })

        const result = await compressAudio(fileClone, setProgress)

        processedFilesRef.current.add(result.compressedFile)

        setOriginalSize(result.originalSize)
        setCompressionRatio(result.compressionRatio)

        setFileValue(result.compressedFile)
      } catch (err) {
        console.error('Audio compression failed:', err)
        setError(
          `Compression failed: ${err instanceof Error ? err.message : 'Unknown error'}.`,
        )
        setProgress(null)
      } finally {
        processingRef.current = false
      }
    },
    [setFileValue, setOriginalSize, setCompressionRatio],
  )

  useEffect(() => {
    if (fileValue instanceof File && fileValue.type.startsWith('audio/')) {
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
        Audio files up to 250MB can be compressed in-browser. We recommend uploading on a laptop or
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
            {error ? 'Compression Error' : 'Audio Compression'}
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

export default AudioCompressionField
