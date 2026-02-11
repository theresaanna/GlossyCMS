'use client'

import React from 'react'
import { useBulkUpload } from '@payloadcms/ui'

const MediaUploadStatusBanner: React.FC = () => {
  let isUploading = false

  try {
    const { successfullyUploaded, initialFiles } = useBulkUpload()
    isUploading = initialFiles?.length > 0 && !successfullyUploaded
  } catch {
    // useBulkUpload not available in this context
    return null
  }

  if (!isUploading) return null

  return (
    <>
      <style>{`
        @keyframes uploadSpin { to { transform: rotate(360deg) } }
        @keyframes uploadSlide {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
      `}</style>
      <div
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '4px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
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
          <span>Uploading media...</span>
        </div>

        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#dbeafe',
            borderRadius: '3px',
            marginTop: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              animation: 'uploadSlide 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </>
  )
}

export default MediaUploadStatusBanner
