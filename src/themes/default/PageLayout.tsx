import type { PageLayoutProps } from '@/themes/types'
import { RenderHero } from '@/heros/RenderHero'
import { RenderBlocks } from '@/blocks/RenderBlocks'

export function PageLayout({ title, hero, blocks, auxiliaryContent }: PageLayoutProps) {
  const showTitle = title && (!hero?.type || hero.type === 'none')

  return (
    <article className="pt-4 pb-24">
      {auxiliaryContent}
      {showTitle && (
        <div className="container mb-8">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading">{title}</h1>
        </div>
      )}
      <RenderHero {...hero} />
      <RenderBlocks blocks={blocks} />
    </article>
  )
}
