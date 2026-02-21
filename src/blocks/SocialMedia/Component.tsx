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

export const SocialMediaBlock: React.FC<Props> = ({ className, header, platforms }) => {
  if (!platforms || platforms.length === 0) return null

  return (
    <div className={cn('container my-16', className)}>
      {header && <h2 className="mb-6 text-2xl font-bold">{header}</h2>}
      <div className="flex flex-wrap gap-6">
        {platforms.map((item, index) => {
          const platformConfig = socialPlatforms.find((p) => p.value === item.platform)
          const isOther = item.platform === 'other'

          const url = isOther ? item.customUrl : `${platformConfig?.urlPrefix}${item.username}`
          const label = isOther ? item.customLabel : platformConfig?.label

          if (!url) return null

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <a
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
              {item.notes && (
                <p className="text-xs text-muted-foreground">{item.notes}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
