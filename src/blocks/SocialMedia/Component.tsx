import React from 'react'

import type { SocialMediaBlock as SocialMediaBlockProps } from '@/payload-types'

import { socialPlatforms } from './platforms'
import { cn } from '@/utilities/ui'
import { ExternalLink } from 'lucide-react'

type Props = {
  className?: string
} & SocialMediaBlockProps

function PlatformIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('size-5', className)}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

export const SocialMediaBlock: React.FC<Props> = ({ className, header, platforms, customPlatforms }) => {
  const hasPlatforms = platforms && platforms.length > 0
  const hasCustomPlatforms = customPlatforms && customPlatforms.length > 0

  if (!hasPlatforms && !hasCustomPlatforms) return null

  return (
    <div className={cn('container my-16', className)}>
      {header && <h2 className="mb-6 text-2xl font-bold">{header}</h2>}
      <div className="flex flex-wrap gap-3">
        {platforms?.map((item, index) => {
          const platformConfig = socialPlatforms.find((p) => p.value === item.platform)
          const isOther = item.platform === 'other'

          const url = isOther ? item.customUrl : `${platformConfig?.urlPrefix}${item.username}`
          const label = isOther ? item.customLabel : platformConfig?.label

          if (!url) return null

          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {platformConfig?.icon ? (
                <PlatformIcon path={platformConfig.icon} />
              ) : (
                <ExternalLink className="size-5" />
              )}
              <span>{label}</span>
            </a>
          )
        })}
        {customPlatforms?.map((item, index) => {
          if (!item.url) return null

          return (
            <a
              key={`custom-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-5" />
              <span>{item.label}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
