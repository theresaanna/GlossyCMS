'use client'

import React from 'react'
import { NavGroup, useNav } from '@payloadcms/ui'
import Link from 'next/link'

const SubscriptionNavLink: React.FC = () => {
  const { setNavOpen } = useNav()

  return (
    <NavGroup label="Globals">
      <Link
        href="/admin/subscription"
        onClick={() => setNavOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--base) calc(var(--base) * 1.25)',
          color: 'var(--theme-elevation-1000)',
          textDecoration: 'none',
          fontSize: '0.875rem',
          borderRadius: 'var(--style-radius-s)',
          transition: 'background-color 150ms ease',
        }}
      >
        Subscription
      </Link>
    </NavGroup>
  )
}

export default SubscriptionNavLink
