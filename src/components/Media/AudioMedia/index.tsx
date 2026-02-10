'use client'

import { cn } from '@/utilities/ui'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { getMediaUrl } from '@/utilities/getMediaUrl'

export const AudioMedia: React.FC<MediaProps> = (props) => {
  const { onClick, resource, className } = props

  if (resource && typeof resource === 'object') {
    const audioUrl = resource.url
      ? getMediaUrl(resource.url)
      : resource.filename
        ? getMediaUrl(`/media/${resource.filename}`)
        : null

    if (!audioUrl) return null

    return (
      <audio controls className={cn(className)} onClick={onClick}>
        <source src={audioUrl} />
        Your browser does not support the audio element.
      </audio>
    )
  }

  return null
}
