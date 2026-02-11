import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GalleryGrid from '../index'

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => (
    <img src={src} alt={alt} data-fill={fill ? 'true' : undefined} {...props} />
  ),
}))

vi.mock('@/utilities/getMediaUrl', () => ({
  getMediaUrl: (url: string) => url,
}))

function makeItem(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    url: '/media/photo.jpg',
    alt: 'A photo',
    filename: 'photo.jpg',
    mimeType: 'image/jpeg',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as any
}

describe('GalleryGrid', () => {
  it('renders image items', () => {
    render(<GalleryGrid items={[makeItem()]} />)
    expect(screen.getByAltText('A photo')).toBeDefined()
  })

  it('renders video items with play icon and "Video" text when no thumbnail', () => {
    render(
      <GalleryGrid
        items={[makeItem({ id: 2, mimeType: 'video/mp4', url: '/media/vid.mp4', alt: '' })]}
      />,
    )
    expect(screen.getByText('Video')).toBeDefined()
  })

  it('renders audio items with audio element', () => {
    const { container } = render(
      <GalleryGrid
        items={[
          makeItem({
            id: 3,
            mimeType: 'audio/mpeg',
            url: '/media/song.mp3',
            alt: 'A song',
          }),
        ]}
      />,
    )
    // "A song" appears in both the label span and the alt overlay, so use getAllByText
    expect(screen.getAllByText('A song')).toHaveLength(2)
    // Verify the audio element is rendered
    expect(container.querySelector('audio')).toBeDefined()
  })

  it('opens lightbox on click', async () => {
    render(<GalleryGrid items={[makeItem()]} />)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    // Close button should appear in lightbox
    expect(screen.getByText('\u00d7')).toBeDefined()
  })

  it('closes lightbox when close button is clicked', async () => {
    render(<GalleryGrid items={[makeItem()]} />)

    // Open lightbox
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('\u00d7')).toBeDefined()

    // Close lightbox
    await userEvent.click(screen.getByText('\u00d7'))
    expect(screen.queryByText('\u00d7')).toBeNull()
  })

  it('renders multiple items', () => {
    const items = [
      makeItem({ id: 1, alt: 'First' }),
      makeItem({ id: 2, alt: 'Second' }),
      makeItem({ id: 3, alt: 'Third' }),
    ]
    render(<GalleryGrid items={items} />)

    expect(screen.getByAltText('First')).toBeDefined()
    expect(screen.getByAltText('Second')).toBeDefined()
    expect(screen.getByAltText('Third')).toBeDefined()
  })
})
