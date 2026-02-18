import type { PostLayoutProps } from '@/themes/types'
import { PostHero } from '@/heros/PostHero'
import RichText from '@/components/RichText'
import { CommentsSection } from '@/components/Comments'
import { RelatedPosts } from '@/blocks/RelatedPosts/Component'

export function PostLayout({ post, auxiliaryContent }: PostLayoutProps) {
  return (
    <article className="pt-16 pb-16">
      {auxiliaryContent}

      <PostHero post={post} />

      <div className="flex flex-col items-center">
        <div className="container">
          <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          {post.enableComments !== false && <CommentsSection postId={String(post.id)} />}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}
        </div>
      </div>
    </article>
  )
}
