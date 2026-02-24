import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'

export const MediumImpactHero: React.FC<Page['hero']> = ({ links, richText }) => {
  return (
    <div className="container mb-8">
      <div className="max-w-[36.5rem]">
        {richText && <RichText className="mb-6 prose-h1:text-lg prose-h1:md:text-xl prose-h1:lg:text-2xl prose-h1:font-heading" data={richText} enableGutter={false} />}
        {Array.isArray(links) && links.length > 0 && (
          <ul className="flex gap-4">
            {links.map(({ link }, i) => {
              return (
                <li key={i}>
                  <CMSLink {...link} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
