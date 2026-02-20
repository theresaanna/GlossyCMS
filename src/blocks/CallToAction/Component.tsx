import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ heading, links, richText }) => {
  return (
    <div className="container">
      {heading && <h2 className="mb-8 text-3xl font-bold">{heading}</h2>}
      <div className="bg-card rounded border-border border p-4 flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div className="max-w-[48rem] flex items-center">
          {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
        </div>
        <div className="flex flex-col gap-8">
          {(links || []).map(({ link }, i) => {
            return (
              <CMSLink
                key={i}
                size="lg"
                {...link}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
