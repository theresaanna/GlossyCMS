import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CarouselGalleryBlock } from '../Component'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))
vi.mock('@payload-config', () => ({ default: {} }))

vi.mock('../CarouselClient', () => ({
  CarouselClient: (props: any) => (
    <div
      data-testid="carousel-client"
      data-items={props.items.length}
      data-autoplay={String(props.autoplay)}
      data-loop={String(props.loop)}
      data-slides-per-view={props.slidesPerView}
    />
  ),
}))

import { getPayload } from 'payload'
const mockGetPayload = vi.mocked(getPayload)

function makeProps(overrides: Record<string, any> = {}) {
  return {
    blockType: 'carouselGallery' as const,
    populateBy: 'folder' as const,
    ...overrides,
  }
}

describe('CarouselGalleryBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no folder is set and populateBy is folder', async () => {
    const result = await CarouselGalleryBlock(makeProps({ folder: null }))
    expect(result).toBeNull()
  })

  it('returns null when selectedMedia is empty and populateBy is selection', async () => {
    const result = await CarouselGalleryBlock(
      makeProps({ populateBy: 'selection', selectedMedia: [] }),
    )
    expect(result).toBeNull()
  })

  it('returns null when selectedMedia is null and populateBy is selection', async () => {
    const result = await CarouselGalleryBlock(
      makeProps({ populateBy: 'selection', selectedMedia: null }),
    )
    expect(result).toBeNull()
  })

  it('returns null when folder query returns no results', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [] }),
    } as any)

    const result = await CarouselGalleryBlock(makeProps({ folder: 1 }))
    expect(result).toBeNull()
  })

  it('renders title when provided', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 1, url: '/img.jpg', mimeType: 'image/jpeg' }],
      }),
    } as any)

    const result = await CarouselGalleryBlock(
      makeProps({ title: 'My Carousel', folder: 1 }),
    )
    render(result as any)
    expect(screen.getByText('My Carousel')).toBeDefined()
  })

  it('does not render title when not provided', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 1, url: '/img.jpg', mimeType: 'image/jpeg' }],
      }),
    } as any)

    const result = await CarouselGalleryBlock(makeProps({ folder: 1 }))
    render(result as any)
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('renders CarouselClient with fetched media items from folder', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [
          { id: 1, url: '/img1.jpg', mimeType: 'image/jpeg' },
          { id: 2, url: '/img2.jpg', mimeType: 'image/png' },
        ],
      }),
    } as any)

    const result = await CarouselGalleryBlock(makeProps({ folder: 1 }))
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-items')).toBe('2')
  })

  it('filters out media items with no URL', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [
          { id: 1, url: '/img.jpg', mimeType: 'image/jpeg' },
          { id: 2, url: '', mimeType: 'image/jpeg' },
          { id: 3, url: null, mimeType: 'image/jpeg' },
        ],
      }),
    } as any)

    const result = await CarouselGalleryBlock(makeProps({ folder: 1 }))
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-items')).toBe('1')
  })

  it('handles folder as an object with id', async () => {
    const mockFind = vi.fn().mockResolvedValue({
      docs: [{ id: 1, url: '/img.jpg', mimeType: 'image/jpeg' }],
    })
    mockGetPayload.mockResolvedValue({ find: mockFind } as any)

    await CarouselGalleryBlock(makeProps({ folder: { id: 42 } }))
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          folder: { equals: 42 },
        }),
      }),
    )
  })

  it('handles individual selection mode', async () => {
    const result = await CarouselGalleryBlock(
      makeProps({
        populateBy: 'selection',
        selectedMedia: [
          { id: 1, url: '/a.jpg', mimeType: 'image/jpeg' } as any,
          { id: 2, url: '/b.jpg', mimeType: 'image/png' } as any,
        ],
      }),
    )
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-items')).toBe('2')
  })

  it('filters out non-image media in selection mode', async () => {
    const result = await CarouselGalleryBlock(
      makeProps({
        populateBy: 'selection',
        selectedMedia: [
          { id: 1, url: '/a.jpg', mimeType: 'image/jpeg' } as any,
          { id: 2, url: '/b.mp4', mimeType: 'video/mp4' } as any,
        ],
      }),
    )
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-items')).toBe('1')
  })

  it('skips non-populated items in selection mode', async () => {
    const result = await CarouselGalleryBlock(
      makeProps({
        populateBy: 'selection',
        selectedMedia: [
          { id: 1, url: '/a.jpg', mimeType: 'image/jpeg' } as any,
          123, // non-populated numeric ID
        ],
      }),
    )
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-items')).toBe('1')
  })

  it('passes carousel config props with defaults', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 1, url: '/img.jpg', mimeType: 'image/jpeg' }],
      }),
    } as any)

    const result = await CarouselGalleryBlock(makeProps({ folder: 1 }))
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-autoplay')).toBe('false')
    expect(carousel.getAttribute('data-loop')).toBe('true')
    expect(carousel.getAttribute('data-slides-per-view')).toBe('1')
  })

  it('passes custom carousel config props', async () => {
    mockGetPayload.mockResolvedValue({
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 1, url: '/img.jpg', mimeType: 'image/jpeg' }],
      }),
    } as any)

    const result = await CarouselGalleryBlock(
      makeProps({
        folder: 1,
        autoplay: true,
        autoplayDelay: 5000,
        loop: false,
        slidesPerView: 3,
      }),
    )
    render(result as any)
    const carousel = screen.getByTestId('carousel-client')
    expect(carousel.getAttribute('data-autoplay')).toBe('true')
    expect(carousel.getAttribute('data-loop')).toBe('false')
    expect(carousel.getAttribute('data-slides-per-view')).toBe('3')
  })
})
