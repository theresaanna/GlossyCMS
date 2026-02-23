'use client'

import React from 'react'
import { ExternalLink } from 'lucide-react'

const ViewLiveSiteLink: React.FC = () => {
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.25rem 0.75rem',
        fontSize: '0.8125rem',
        color: 'var(--theme-elevation-600)',
        textDecoration: 'none',
        borderRadius: '0.25rem',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--theme-elevation-900)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--theme-elevation-600)'
      }}
    >
      <ExternalLink size={14} />
      View Live Site
    </a>
  )
}

export default ViewLiveSiteLink
