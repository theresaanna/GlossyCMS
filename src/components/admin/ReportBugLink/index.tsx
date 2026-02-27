'use client'

import React from 'react'

const ReportBugLink: React.FC = () => {
  return (
    <a
      href="https://wkf.ms/4qSABHT"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Report a bug"
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 14, height: 14 }}
        aria-hidden="true"
      >
        <path d="M8 2l1.88 1.88" />
        <path d="M14.12 3.88L16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
      </svg>
      Report a bug
    </a>
  )
}

export default ReportBugLink
