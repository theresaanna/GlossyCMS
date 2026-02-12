import type { TwitterFeedBlock as TwitterFeedBlockProps } from '@/payload-types'

import React from 'react'

import { fetchTweets, type Tweet } from '@/utilities/twitter'

export const TwitterFeedBlock: React.FC<
  TwitterFeedBlockProps & {
    id?: string
    disableInnerContainer?: boolean
  }
> = async (props) => {
  const { id, title, twitterUsername, numberOfTweets } = props

  const count = numberOfTweets || 5

  const bearerToken = process.env.TWITTER_BEARER_TOKEN

  if (!bearerToken) {
    return (
      <div className="container" id={`block-${id}`}>
        <p className="text-sm text-gray-500">
          Twitter feed unavailable. Set the TWITTER_BEARER_TOKEN environment variable.
        </p>
      </div>
    )
  }

  const { tweets, error } = await fetchTweets(bearerToken, twitterUsername, count)

  if (error) {
    return (
      <div className="container" id={`block-${id}`}>
        {title && <h2 className="mb-8 text-3xl font-bold">{title}</h2>}
        <p className="text-sm text-gray-500">Unable to load tweets: {error}</p>
      </div>
    )
  }

  if (tweets.length === 0) {
    return (
      <div className="container" id={`block-${id}`}>
        {title && <h2 className="mb-8 text-3xl font-bold">{title}</h2>}
        <p className="text-sm text-gray-500">No recent tweets found for @{twitterUsername}.</p>
      </div>
    )
  }

  return (
    <div className="container" id={`block-${id}`}>
      {title && <h2 className="mb-8 text-3xl font-bold">{title}</h2>}
      <div className="grid gap-4">
        {tweets.map((tweet) => (
          <TweetCard key={tweet.id} tweet={tweet} />
        ))}
      </div>
    </div>
  )
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  const date = new Date(tweet.created_at)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const tweetUrl = `https://x.com/${tweet.author.username}/status/${tweet.id}`

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:bg-card/80"
    >
      <div className="mb-3 flex items-center gap-3">
        {tweet.author.profile_image_url && (
          <img
            src={tweet.author.profile_image_url}
            alt={tweet.author.name}
            className="h-10 w-10 rounded-full"
          />
        )}
        <div>
          <p className="font-semibold leading-tight">{tweet.author.name}</p>
          <p className="text-sm text-muted-foreground">@{tweet.author.username}</p>
        </div>
        <time className="ml-auto text-sm text-muted-foreground" dateTime={tweet.created_at}>
          {formattedDate}
        </time>
      </div>

      <p className="mb-3 whitespace-pre-wrap">{tweet.text}</p>

      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>{tweet.public_metrics.reply_count} replies</span>
        <span>{tweet.public_metrics.retweet_count} retweets</span>
        <span>{tweet.public_metrics.like_count} likes</span>
      </div>
    </a>
  )
}
