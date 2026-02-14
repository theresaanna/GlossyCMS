'use client'
import React, { useEffect, useRef } from 'react'

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: HTMLElement) => void
      }
    }
  }
}

type Props = {
  username: string
  tweetLimit: number
}

export const TwitterTimeline: React.FC<Props> = ({ username, tweetLimit }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]',
    )

    const loadWidget = () => {
      if (window.twttr?.widgets?.load && containerRef.current) {
        window.twttr.widgets.load(containerRef.current)
      }
    }

    if (existingScript) {
      loadWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      script.onload = loadWidget
      document.body.appendChild(script)
    }
  }, [username, tweetLimit])

  return (
    <div ref={containerRef}>
      <a
        className="twitter-timeline"
        data-tweet-limit={tweetLimit}
        href={`https://twitter.com/${username}`}
      >
        Tweets by @{username}
      </a>
    </div>
  )
}
