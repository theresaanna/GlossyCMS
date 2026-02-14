import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../Component.client', () => ({
  TwitterTimeline: ({ username, tweetLimit }: { username: string; tweetLimit: number }) => (
    <div data-testid="twitter-timeline" data-username={username} data-tweet-limit={tweetLimit}>
      Mock Twitter Timeline for @{username}
    </div>
  ),
}))

vi.mock('@/payload-types', () => ({}))

import { TwitterBlock } from '../Component'

describe('TwitterBlock Component', () => {
  it('renders nothing when username is empty', () => {
    const { container } = render(
      <TwitterBlock blockType="twitter" username="" />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders the twitter timeline with username', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" />,
    )
    expect(screen.getByTestId('twitter-timeline')).toBeDefined()
    expect(screen.getByTestId('twitter-timeline').getAttribute('data-username')).toBe('testuser')
  })

  it('renders the title when provided', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" title="My Feed" />,
    )
    expect(screen.getByText('My Feed')).toBeDefined()
    expect(screen.getByText('My Feed').tagName).toBe('H2')
  })

  it('does not render title when not provided', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" />,
    )
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('renders a link to the Twitter profile', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" />,
    )
    const link = screen.getByText('View @testuser on Twitter')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('https://twitter.com/testuser')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('passes tweetLimit to the timeline component', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" tweetLimit={5} />,
    )
    expect(screen.getByTestId('twitter-timeline').getAttribute('data-tweet-limit')).toBe('5')
  })

  it('defaults tweetLimit to 10 when not provided', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" />,
    )
    expect(screen.getByTestId('twitter-timeline').getAttribute('data-tweet-limit')).toBe('10')
  })

  it('defaults tweetLimit to 10 when null', () => {
    render(
      <TwitterBlock blockType="twitter" username="testuser" tweetLimit={null} />,
    )
    expect(screen.getByTestId('twitter-timeline').getAttribute('data-tweet-limit')).toBe('10')
  })

  it('sets the block id on the container div', () => {
    const { container } = render(
      <TwitterBlock blockType="twitter" username="testuser" id="abc123" />,
    )
    expect(container.querySelector('#block-abc123')).toBeDefined()
  })
})
