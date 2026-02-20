import React from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { AdminColorSchemeClient } from './Client'

const AdminColorSchemeProvider: React.FC<{ children: React.ReactNode }> = async ({ children }) => {
  let colorSchemeLight = 'default'
  let colorSchemeDark = 'default'

  try {
    const payload = await getPayload({ config: configPromise })
    const siteSettings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
    })

    colorSchemeLight = siteSettings?.colorSchemeLight ?? 'default'
    colorSchemeDark = siteSettings?.colorSchemeDark ?? 'default'
  } catch {
    // Silently fail — will use default scheme
  }

  return (
    <AdminColorSchemeClient colorSchemeLight={colorSchemeLight} colorSchemeDark={colorSchemeDark}>
      {children}
    </AdminColorSchemeClient>
  )
}

export default AdminColorSchemeProvider
