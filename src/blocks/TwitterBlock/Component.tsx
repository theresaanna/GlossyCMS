import type { TwitterBlock as TwitterBlockProps } from '@/payload-types'

import React from 'react'

import { TwitterTimeline } from './Component.client'

type Props = TwitterBlockProps & {
  id?: string
  disableInnerContainer?: boolean
}

export const TwitterBlock: React.FC<Props> = (props) => {
  const { id, username, title, tweetLimit } = props

  if (!username) {
    return null
  }

  return (
    <div className="container" id={id ? `block-${id}` : undefined}>
      {title && <h2 className="mb-8 text-3xl font-bold">{title}</h2>}
      <TwitterTimeline
        key={`${username}-${tweetLimit}`}
        username={username}
        tweetLimit={tweetLimit ?? 10}
      />
      <p className="mt-4">
        <a
          href={`https://twitter.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          View @{username} on Twitter
        </a>
      </p>
    </div>
  )
}
