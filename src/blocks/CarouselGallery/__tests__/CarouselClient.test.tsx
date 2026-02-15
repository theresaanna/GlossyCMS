import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CarouselClient } from '../CarouselClient'

vi.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }: any) => (
    <div data-testid="swiper" data-loop={String(props.loop)} data-slides-per-view={props.slidesPerView}>
      {children}
    </div>
  ),
  SwiperSlide: ({ children }: any) => (
    <div data-testid="swiper-slide">{children}</div>
  ),
}))

vi.mock('swiper/modules', () => ({
  Navigation: 'Navigation',
  Pagination: 'Pagination',
  Autoplay: 'Autoplay',
  A11y: 'A11y',
}))

vi.mock('swiper/css', () => ({}))
vi.mock('swiper/css/navigation', () => ({}))
vi.mock('swiper/css/pagination', () => ({}))

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))

const mockItems = [
  { id: 1, url: '/img1.jpg', alt: 'Image 1', filename: 'img1.jpg', mimeType: 'image/jpeg' },
  { id: 2, url: '/img2.jpg', alt: 'Image 2', filename: 'img2.jpg', mimeType: 'image/png' },
] as any[]

describe('CarouselClient', () => {
  it('renders a Swiper container', () => {
    render(
      <CarouselClient
        items={mockItems}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={1}
      />,
    )
    expect(screen.getByTestId('swiper')).toBeDefined()
  })

  it('renders one SwiperSlide per item', () => {
    render(
      <CarouselClient
        items={mockItems}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={1}
      />,
    )
    expect(screen.getAllByTestId('swiper-slide')).toHaveLength(2)
  })

  it('renders images with correct alt text', () => {
    render(
      <CarouselClient
        items={mockItems}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={1}
      />,
    )
    expect(screen.getByAltText('Image 1')).toBeDefined()
    expect(screen.getByAltText('Image 2')).toBeDefined()
  })

  it('uses filename as fallback alt text', () => {
    const items = [{ id: 1, url: '/img.jpg', alt: null, filename: 'photo.jpg', mimeType: 'image/jpeg' }] as any[]
    render(
      <CarouselClient
        items={items}
        autoplay={false}
        autoplayDelay={3000}
        loop={false}
        slidesPerView={1}
      />,
    )
    expect(screen.getByAltText('photo.jpg')).toBeDefined()
  })

  it('renders alt text overlay when alt is present', () => {
    render(
      <CarouselClient
        items={mockItems}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={1}
      />,
    )
    expect(screen.getByText('Image 1')).toBeDefined()
    expect(screen.getByText('Image 2')).toBeDefined()
  })

  it('does not render alt overlay when alt is missing', () => {
    const items = [{ id: 1, url: '/img.jpg', alt: null, filename: 'photo.jpg', mimeType: 'image/jpeg' }] as any[]
    render(
      <CarouselClient
        items={items}
        autoplay={false}
        autoplayDelay={3000}
        loop={false}
        slidesPerView={1}
      />,
    )
    const slides = screen.getAllByTestId('swiper-slide')
    const overlayText = slides[0].querySelector('.bg-gradient-to-t')
    expect(overlayText).toBeNull()
  })

  it('renders with empty items (no slides)', () => {
    render(
      <CarouselClient
        items={[]}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={1}
      />,
    )
    expect(screen.queryAllByTestId('swiper-slide')).toHaveLength(0)
  })

  it('disables loop when items count equals slidesPerView', () => {
    render(
      <CarouselClient
        items={mockItems}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={2}
      />,
    )
    const swiper = screen.getByTestId('swiper')
    expect(swiper.getAttribute('data-loop')).toBe('false')
  })

  it('enables loop when items count exceeds slidesPerView', () => {
    render(
      <CarouselClient
        items={mockItems}
        autoplay={false}
        autoplayDelay={3000}
        loop={true}
        slidesPerView={1}
      />,
    )
    const swiper = screen.getByTestId('swiper')
    expect(swiper.getAttribute('data-loop')).toBe('true')
  })
})
