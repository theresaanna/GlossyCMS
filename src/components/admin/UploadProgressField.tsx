'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useField, useFormProcessing, useFormSubmitted } from '@payloadcms/ui'

type UploadPhase = 'idle' | 'ready' | 'uploading' | 'complete'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function useSimulatedProgress(isActive: boolean): number {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isActive) {
      setProgress(0)
      let current = 0
      intervalRef.current = setInterval(() => {
        current += (80 - current) * 0.05
        setProgress(Math.min(Math.round(current), 80))
      }, 200)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive])

  return progress
}

const UploadProgressField: React.FC = () => {
  const { value: fileValue } = useField<File | null>({ path: 'file' })
  const isProcessing = useFormProcessing()
  const isSubmitted = useFormSubmitted()

  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const wasProcessingRef = useRef(false)
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const simulatedProgress = useSimulatedProgress(phase === 'uploading')

  // Detect file selection
  useEffect(() => {
    if (fileValue instanceof File) {
      setFileName(fileValue.name)
      setFileSize(fileValue.size)
      setPhase('ready')
    }
  }, [fileValue])

  // Detect form processing (upload in progress)
  useEffect(() => {
    if (isProcessing && fileValue instanceof File) {
      setPhase('uploading')
      wasProcessingRef.current = true
    }
  }, [isProcessing, fileValue])

  // Detect upload completion
  useEffect(() => {
    if (wasProcessingRef.current && !isProcessing && isSubmitted) {
      setPhase('complete')
      wasProcessingRef.current = false

      clearTimeoutRef.current = setTimeout(() => {
        setPhase('idle')
      }, 3000)
    }

    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current)
        clearTimeoutRef.current = null
      }
    }
  }, [isProcessing, isSubmitted])

  if (phase === 'idle') return null

  const bgColor =
    phase === 'complete' ? '#f0fdf4' : phase === 'uploading' ? '#eff6ff' : '#f9fafb'
  const borderColor =
    phase === 'complete' ? '#bbf7d0' : phase === 'uploading' ? '#bfdbfe' : '#e5e7eb'

  return (
    <>
      <style>{`@keyframes uploadSpin { to { transform: rotate(360deg) } }`}</style>
      <div
        style={{
          padding: '12px 16px',
          margin: '8px 0',
          borderRadius: '4px',
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {phase === 'uploading' && (
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid #bfdbfe',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'uploadSpin 1s linear infinite',
                flexShrink: 0,
              }}
            />
          )}
          {phase === 'complete' && (
            <span style={{ color: '#16a34a', fontSize: '16px', flexShrink: 0 }}>&#10003;</span>
          )}
          <span>
            {phase === 'ready' && 'File Ready'}
            {phase === 'uploading' && 'Uploading...'}
            {phase === 'complete' && 'Upload Complete'}
          </span>
        </div>

        <div style={{ fontSize: '13px', marginTop: '4px', color: '#374151' }}>
          {phase === 'ready' && `${fileName} (${formatFileSize(fileSize)})`}
          {phase === 'uploading' && `Uploading ${fileName}...`}
          {phase === 'complete' && `${fileName} uploaded successfully`}
        </div>

        {phase === 'uploading' && (
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
                width: `${simulatedProgress}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default UploadProgressField
