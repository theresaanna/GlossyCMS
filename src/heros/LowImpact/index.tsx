import React from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'

type LowImpactHeroType =
  | {
      children?: React.ReactNode
      richText?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText }) => {
  return (
    <div className="container">
      <div className="max-w-[48rem]">
        {children || (richText && <RichText className="prose-h1:text-base prose-h1:md:text-lg prose-h1:lg:text-xl prose-h1:font-heading" data={richText} enableGutter={false} />)}
      </div>
    </div>
  )
}
