'use client'

import React, { useEffect } from 'react'

interface AdminColorSchemeClientProps {
  children: React.ReactNode
  colorSchemeLight: string
  colorSchemeDark: string
}

export const AdminColorSchemeClient: React.FC<AdminColorSchemeClientProps> = ({
  children,
  colorSchemeLight,
  colorSchemeDark,
}) => {
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-color-scheme-light', colorSchemeLight)
    html.setAttribute('data-color-scheme-dark', colorSchemeDark)
  }, [colorSchemeLight, colorSchemeDark])

  return <>{children}</>
}
