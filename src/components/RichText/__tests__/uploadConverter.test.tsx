import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/Media', () => ({
  Media: (props: any) => {
    const resource = props.resource
    return (
      <div
        data-testid="media-component"
        data-alt={resource?.alt}
        data-url={resource?.url}
      />
    )
  },
}))

vi.mock('@payloadcms/richtext-lexical/react', () => ({
  RichText: (props: any) => <div data-testid="richtext">{JSON.stringify(props)}</div>,
  LinkJSXConverter: () => ({}),
}))

import { InlineUploadMedia } from '../InlineUploadMedia'

describe('Upload converter integration', () => {
  it('InlineUploadMedia renders with populated media object', () => {
    const media = {
      id: 42,
      url: '/media/photo.jpg',
      mimeType: 'image/jpeg',
      width: 1200,
      height: 800,
      alt: 'Photo alt',
      filename: 'photo.jpg',
      filesize: 50000,
      updatedAt: '2025-06-01T00:00:00.000Z',
      createdAt: '2025-06-01T00:00:00.000Z',
    }

    render(<InlineUploadMedia media={media as any} alt="Custom alt" />)

    const el = screen.getByTestId('media-component')
    expect(el.getAttribute('data-alt')).toBe('Custom alt')
    expect(el.getAttribute('data-url')).toBe('/media/photo.jpg')
  })

  it('InlineUploadMedia renders null-safe for missing url', () => {
    const media = {
      id: 1,
      url: null,
      mimeType: 'image/jpeg',
      width: 0,
      height: 0,
      alt: null,
      filename: null,
      filesize: null,
      updatedAt: '2025-01-01T00:00:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z',
    }

    render(<InlineUploadMedia media={media as any} alt="" />)

    const el = screen.getByTestId('media-component')
    expect(el).toBeDefined()
  })
})
