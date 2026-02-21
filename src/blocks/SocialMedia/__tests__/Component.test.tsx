import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialMediaBlock } from '../Component'
import type { SocialMediaBlock as SocialMediaBlockProps } from '@/payload-types'

vi.mock('lucide-react', () => ({
  ExternalLink: (props: any) => <svg data-testid="external-link-icon" {...props} />,
}))

function makeProps(overrides: Partial<SocialMediaBlockProps> = {}): SocialMediaBlockProps {
  return {
    blockType: 'socialMedia',
    platforms: [],
    ...overrides,
  }
}

describe('SocialMediaBlock', () => {
  it('returns null when platforms is empty', () => {
    const { container } = render(<SocialMediaBlock {...makeProps()} />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when platforms is null', () => {
    const { container } = render(<SocialMediaBlock {...makeProps({ platforms: null })} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders a known platform link with correct URL', () => {
    render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [{ platform: 'x', username: 'testuser', id: '1' }],
        })}
      />,
    )

    const link = screen.getByText('X (Twitter)').closest('a')
    expect(link?.getAttribute('href')).toBe('https://x.com/testuser')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders Instagram link with correct URL', () => {
    render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [{ platform: 'instagram', username: 'myinsta', id: '1' }],
        })}
      />,
    )

    const link = screen.getByText('Instagram').closest('a')
    expect(link?.getAttribute('href')).toBe('https://instagram.com/myinsta')
  })

  it('renders an "other" platform with custom label and URL', () => {
    render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [
            {
              platform: 'other',
              customLabel: 'My Site',
              customUrl: 'https://example.com/me',
              id: '1',
            },
          ],
        })}
      />,
    )

    const link = screen.getByText('My Site').closest('a')
    expect(link?.getAttribute('href')).toBe('https://example.com/me')
  })

  it('renders ExternalLink icon for "other" platforms', () => {
    render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [
            {
              platform: 'other',
              customLabel: 'Custom',
              customUrl: 'https://example.com',
              id: '1',
            },
          ],
        })}
      />,
    )

    expect(screen.getByTestId('external-link-icon')).toBeDefined()
  })

  it('renders SVG icon for known platforms', () => {
    const { container } = render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [{ platform: 'facebook', username: 'testpage', id: '1' }],
        })}
      />,
    )

    const svg = container.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeDefined()
    expect(svg?.querySelector('path')?.getAttribute('d')).toBeTruthy()
  })

  it('renders multiple platforms', () => {
    render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [
            { platform: 'x', username: 'user1', id: '1' },
            { platform: 'instagram', username: 'user2', id: '2' },
            { platform: 'throne', username: 'user3', id: '3' },
          ],
        })}
      />,
    )

    expect(screen.getByText('X (Twitter)')).toBeDefined()
    expect(screen.getByText('Instagram')).toBeDefined()
    expect(screen.getByText('Throne')).toBeDefined()
  })

  it('skips platforms with no URL', () => {
    const { container } = render(
      <SocialMediaBlock
        {...makeProps({
          platforms: [
            { platform: 'other', customLabel: 'No URL', id: '1' },
          ],
        })}
      />,
    )

    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  describe('notes', () => {
    it('renders notes text below the link when provided', () => {
      render(
        <SocialMediaBlock
          {...makeProps({
            platforms: [
              { platform: 'x', username: 'testuser', notes: 'Follow for updates', id: '1' },
            ],
          })}
        />,
      )

      const notes = screen.getByText('Follow for updates')
      expect(notes).toBeDefined()
      expect(notes.tagName).toBe('P')
    })

    it('does not render notes when not provided', () => {
      const { container } = render(
        <SocialMediaBlock
          {...makeProps({
            platforms: [{ platform: 'x', username: 'testuser', id: '1' }],
          })}
        />,
      )

      expect(container.querySelectorAll('p')).toHaveLength(0)
    })

    it('does not render notes when set to empty string', () => {
      const { container } = render(
        <SocialMediaBlock
          {...makeProps({
            platforms: [{ platform: 'x', username: 'testuser', notes: '', id: '1' }],
          })}
        />,
      )

      expect(container.querySelectorAll('p')).toHaveLength(0)
    })

    it('renders notes for each platform that has them', () => {
      render(
        <SocialMediaBlock
          {...makeProps({
            platforms: [
              { platform: 'x', username: 'user1', notes: 'Note one', id: '1' },
              { platform: 'instagram', username: 'user2', id: '2' },
              { platform: 'facebook', username: 'user3', notes: 'Note three', id: '3' },
            ],
          })}
        />,
      )

      expect(screen.getByText('Note one')).toBeDefined()
      expect(screen.getByText('Note three')).toBeDefined()
    })
  })

  describe('layout', () => {
    it('renders each platform in its own row', () => {
      const { container } = render(
        <SocialMediaBlock
          {...makeProps({
            platforms: [
              { platform: 'x', username: 'user1', id: '1' },
              { platform: 'instagram', username: 'user2', id: '2' },
            ],
          })}
        />,
      )

      const wrapperDivs = container.querySelectorAll('.flex.flex-col.gap-1')
      expect(wrapperDivs).toHaveLength(2)
    })
  })

  describe('header', () => {
    it('renders the header when provided', () => {
      render(
        <SocialMediaBlock
          {...makeProps({
            header: 'Follow Me',
            platforms: [{ platform: 'x', username: 'user1', id: '1' }],
          })}
        />,
      )

      const heading = screen.getByText('Follow Me')
      expect(heading).toBeDefined()
      expect(heading.tagName).toBe('H2')
    })

    it('does not render header when not provided', () => {
      const { container } = render(
        <SocialMediaBlock
          {...makeProps({
            platforms: [{ platform: 'x', username: 'user1', id: '1' }],
          })}
        />,
      )

      expect(container.querySelector('h2')).toBeNull()
    })

    it('does not render header when set to empty string', () => {
      const { container } = render(
        <SocialMediaBlock
          {...makeProps({
            header: '',
            platforms: [{ platform: 'x', username: 'user1', id: '1' }],
          })}
        />,
      )

      expect(container.querySelector('h2')).toBeNull()
    })
  })
})
