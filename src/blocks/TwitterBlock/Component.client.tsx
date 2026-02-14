'use client'
import React, { useEffect, useRef } from 'react'

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: HTMLElement) => void
        createTimeline: (
          source: { sourceType: string; screenName: string },
          target: HTMLElement,
          options?: Record<string, unknown>,
        ) => Promise<HTMLElement>
      }
      _e?: Array<() => void>
      ready: (callback: (twttr: Window['twttr']) => void) => void
    }
  }
}

type Props = {
  username: string
  tweetLimit: number
}

function loadWidgetsScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.twttr?.widgets?.createTimeline) {
      resolve()
      return
    }

    const existingScript = document.querySelector(
      'script[src="https://platform.twitter.com/widgets.js"]',
    )

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      script.charset = 'utf-8'
      document.head.appendChild(script)
    }

    // Use Twitter's ready callback to know when the API is available
    window.twttr = window.twttr || ({ _e: [] } as unknown as Window['twttr'])
    window.twttr!.ready = window.twttr!.ready || function (cb) {
      window.twttr!._e!.push(() => cb(window.twttr))
    }
    window.twttr!.ready(() => resolve())
  })
}

export const TwitterTimeline: React.FC<Props> = ({ username, tweetLimit }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function renderTimeline() {
      await loadWidgetsScript()

      if (cancelled || !containerRef.current || !window.twttr?.widgets?.createTimeline) return

      // Clear any previously rendered widget
      containerRef.current.innerHTML = ''

      try {
        await window.twttr.widgets.createTimeline(
          { sourceType: 'profile', screenName: username },
          containerRef.current,
          { tweetLimit },
        )
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<p>Unable to load timeline for @${username}.</p>`
        }
      }
    }

    renderTimeline()

    return () => {
      cancelled = true
    }
  }, [username, tweetLimit])

  return (
    <div ref={containerRef}>
      <p>Loading tweets by @{username}…</p>
    </div>
  )
}
