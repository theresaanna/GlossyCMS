import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InlineUploadMedia } from '../InlineUploadMedia'
import type { Media } from '@/payload-types'

vi.mock('@/components/Media', () => ({
  Media: (props: any) => {
    const resource = props.resource
    return (
      <div
        data-testid="media-component"
        data-alt={resource?.alt}
        data-url={resource?.url}
        data-mime-type={resource?.mimeType}
        className={props.imgClassName}
      />
    )
  },
}))

function makeMedia(overrides: Partial<Media> = {}): Media {
  return {
    id: 1,
    alt: 'Default alt text',
    url: '/media/test-image.jpg',
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
    filename: 'test-image.jpg',
    filesize: 12345,
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  } as Media
}

describe('InlineUploadMedia', () => {
  it('renders the Media component with resource', () => {
    const media = makeMedia()
    render(<InlineUploadMedia media={media} alt="Test alt" />)

    const el = screen.getByTestId('media-component')
    expect(el).toBeDefined()
    expect(el.getAttribute('data-alt')).toBe('Test alt')
    expect(el.getAttribute('data-url')).toBe('/media/test-image.jpg')
  })

  it('uses provided alt text over media alt', () => {
    const media = makeMedia({ alt: 'Original alt' })
    render(<InlineUploadMedia media={media} alt="Override alt" />)

    const el = screen.getByTestId('media-component')
    expect(el.getAttribute('data-alt')).toBe('Override alt')
  })

  it('renders within a wrapper div', () => {
    const media = makeMedia()
    const { container } = render(<InlineUploadMedia media={media} alt="Test" />)

    const wrapper = container.firstElementChild
    expect(wrapper?.tagName).toBe('DIV')
    expect(wrapper?.className).toContain('my-4')
  })

  it('passes video mime type through to Media', () => {
    const media = makeMedia({ mimeType: 'video/mp4', url: '/media/test-video.mp4' })
    render(<InlineUploadMedia media={media} alt="Video" />)

    const el = screen.getByTestId('media-component')
    expect(el.getAttribute('data-mime-type')).toBe('video/mp4')
  })

  it('handles empty alt text', () => {
    const media = makeMedia({ alt: null })
    render(<InlineUploadMedia media={media} alt="" />)

    const el = screen.getByTestId('media-component')
    expect(el.getAttribute('data-alt')).toBe('')
  })
})
