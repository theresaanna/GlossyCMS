import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <div className="container">
      <div className="max-w-[48rem] mx-auto">
        <div className="uppercase text-sm mb-4 text-muted-foreground">
          {categories?.map((category, index) => {
            if (typeof category === 'object' && category !== null) {
              const { title: categoryTitle } = category

              const titleToUse = categoryTitle || 'Untitled category'

              const isLast = index === categories.length - 1

              return (
                <React.Fragment key={index}>
                  {titleToUse}
                  {!isLast && <React.Fragment>, &nbsp;</React.Fragment>}
                </React.Fragment>
              )
            }
            return null
          })}
        </div>

        <h1 className="mb-4 text-3xl md:text-5xl lg:text-6xl">{title}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-8">
          {hasAuthors && <span>By {formatAuthors(populatedAuthors)}</span>}
          {hasAuthors && publishedAt && <span aria-hidden="true">&middot;</span>}
          {publishedAt && <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>}
        </div>

        {heroImage && typeof heroImage !== 'string' && (
          <div className="mb-8">
            <Media resource={heroImage} imgClassName="rounded-lg w-full" />
          </div>
        )}
      </div>
    </div>
  )
}
