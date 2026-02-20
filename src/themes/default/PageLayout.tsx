import type { PageLayoutProps } from '@/themes/types'
import { RenderHero } from '@/heros/RenderHero'
import { RenderBlocks } from '@/blocks/RenderBlocks'

export function PageLayout({ hero, blocks, auxiliaryContent }: PageLayoutProps) {
  return (
    <article className="pt-4 pb-24">
      {auxiliaryContent}
      <RenderHero {...hero} />
      <RenderBlocks blocks={blocks} />
    </article>
  )
}
