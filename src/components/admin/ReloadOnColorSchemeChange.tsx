'use client'

import { useEffect, useRef } from 'react'
import { useFormSubmitted, useFormProcessing } from '@payloadcms/ui'

/**
 * Hidden UI field that reloads the admin panel after a successful save
 * so the color scheme updates are reflected immediately.
 */
export const ReloadOnColorSchemeChange = () => {
  const submitted = useFormSubmitted()
  const processing = useFormProcessing()
  const wasProcessing = useRef(false)

  useEffect(() => {
    if (processing) {
      wasProcessing.current = true
    }

    // Reload once form was processing and has now finished with submitted=true
    if (wasProcessing.current && !processing && submitted) {
      window.location.reload()
    }
  }, [processing, submitted])

  return null
}
