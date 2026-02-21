import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  breakout?: boolean
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

const sizeClasses: Record<string, string> = {
  small: 'max-w-xs',
  medium: 'max-w-md',
  large: 'max-w-[48rem]',
  full: '',
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    enableGutter = true,
    imgClassName,
    media,
    size,
    staticImage,
    disableInnerContainer,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  const sizeClass = sizeClasses[size || 'full'] || ''

  return (
    <div
      className={cn(
        '',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) && (
        <div className={cn(sizeClass, { 'mx-auto': size && size !== 'full' })}>
          <Media
            imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
            videoClassName="border border-border rounded-[0.8rem] max-w-full max-h-[80vh]"
            resource={media}
            src={staticImage}
          />
        </div>
      )}
      {caption && (
        <div
          className={cn(
            'mt-6',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} />
        </div>
      )}
    </div>
  )
}
