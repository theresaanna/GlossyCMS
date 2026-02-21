import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const AdminLogo: React.FC = async () => {
  let siteTitle = 'Glossy'

  try {
    const payload = await getPayload({ config: configPromise })
    const siteSettings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
    })

    if (siteSettings?.siteTitle) {
      siteTitle = siteSettings.siteTitle
    }
  } catch {
    // Fall back to default
  }

  return (
    <span
      style={{
        fontFamily: "'Lexend', sans-serif",
        fontWeight: 600,
        fontSize: '2.25rem',
        lineHeight: '2.5rem',
        color: 'var(--theme-text)',
      }}
    >
      {siteTitle}
    </span>
  )
}

export default AdminLogo
