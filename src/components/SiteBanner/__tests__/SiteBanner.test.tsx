import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/utilities/getMediaUrl', () => ({
  getMediaUrl: (url: string | null | undefined, _cacheTag?: string | null) => url || '',
}))

import { SiteBanner } from '../index'

describe('SiteBanner', () => {
  const mockHeaderImage = {
    url: '/media/banner.jpg',
    alt: 'My banner',
    width: 1920,
    height: 400,
    updatedAt: '2026-01-01',
    sizes: {
      xlarge: { url: '/media/banner-xlarge.jpg' },
      large: { url: '/media/banner-large.jpg' },
    },
  }

  const mockUserImage = {
    url: '/media/avatar.jpg',
    alt: 'My avatar',
    width: 500,
    height: 500,
    updatedAt: '2026-01-01',
    sizes: {
      square: { url: '/media/avatar-square.jpg' },
      small: { url: '/media/avatar-small.jpg' },
    },
  }

  it('renders the site-banner container', () => {
    render(<SiteBanner />)
    expect(screen.getByTestId('site-banner')).toBeDefined()
  })

  it('renders the banner image when headerImage is provided', () => {
    render(<SiteBanner headerImage={mockHeaderImage} />)
    const img = screen.getAllByRole('img')[0]
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/media/banner-xlarge.jpg')
    expect(img.getAttribute('alt')).toBe('My banner')
  })

  it('renders a gradient placeholder when no headerImage is provided', () => {
    const { container } = render(<SiteBanner />)
    const gradient = container.querySelector('.bg-gradient-to-r')
    expect(gradient).toBeDefined()
  })

  it('renders the avatar image when userImage is provided', () => {
    render(<SiteBanner userImage={mockUserImage} />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/avatar-square.jpg')
    expect(img.getAttribute('alt')).toBe('My avatar')
  })

  it('renders an initial fallback when no userImage is provided', () => {
    render(<SiteBanner siteTitle="My Site" />)
    expect(screen.getByText('M')).toBeDefined()
  })

  it('renders "?" as fallback initial when no siteTitle or userImage', () => {
    render(<SiteBanner />)
    expect(screen.getByText('?')).toBeDefined()
  })

  it('does not render the site title (title is now in the header bar)', () => {
    render(<SiteBanner siteTitle="Hello World" />)
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('prefers xlarge size for banner image', () => {
    render(<SiteBanner headerImage={mockHeaderImage} />)
    const img = screen.getAllByRole('img')[0]
    expect(img.getAttribute('src')).toBe('/media/banner-xlarge.jpg')
  })

  it('falls back to large size when xlarge is not available', () => {
    const imageWithoutXlarge = {
      ...mockHeaderImage,
      sizes: { large: { url: '/media/banner-large.jpg' } },
    }
    render(<SiteBanner headerImage={imageWithoutXlarge} />)
    const img = screen.getAllByRole('img')[0]
    expect(img.getAttribute('src')).toBe('/media/banner-large.jpg')
  })

  it('falls back to full URL when no sizes are available for banner', () => {
    const imageWithoutSizes = {
      ...mockHeaderImage,
      sizes: null,
    }
    render(<SiteBanner headerImage={imageWithoutSizes} />)
    const img = screen.getAllByRole('img')[0]
    expect(img.getAttribute('src')).toBe('/media/banner.jpg')
  })

  it('prefers square size for avatar', () => {
    render(<SiteBanner userImage={mockUserImage} />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/avatar-square.jpg')
  })

  it('falls back to small size for avatar when square is not available', () => {
    const imageWithoutSquare = {
      ...mockUserImage,
      sizes: { small: { url: '/media/avatar-small.jpg' } },
    }
    render(<SiteBanner userImage={imageWithoutSquare} />)
    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/avatar-small.jpg')
  })

  it('ignores numeric IDs for headerImage (not populated)', () => {
    render(<SiteBanner headerImage={42 as any} />)
    const { container } = render(<SiteBanner headerImage={42 as any} />)
    const gradient = container.querySelector('.bg-gradient-to-r')
    expect(gradient).toBeDefined()
  })

  it('ignores numeric IDs for userImage (not populated)', () => {
    render(<SiteBanner userImage={42 as any} siteTitle="Test" />)
    expect(screen.getAllByText('T').length).toBeGreaterThan(0)
  })

  it('renders both banner and avatar together', () => {
    render(
      <SiteBanner
        headerImage={mockHeaderImage}
        userImage={mockUserImage}
        siteTitle="My Blog"
      />,
    )
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  describe('admin link behavior', () => {
    it('avatar links to "/" when isAdmin is false', () => {
      render(<SiteBanner siteTitle="Test" />)
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/')
    })

    it('avatar links to "/" when isAdmin is undefined', () => {
      render(<SiteBanner siteTitle="Test" isAdmin={undefined} />)
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/')
    })

    it('avatar links to admin site settings when isAdmin is true', () => {
      render(<SiteBanner siteTitle="Test" isAdmin={true} />)
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/admin/globals/site-settings')
    })

    it('shows gear icon when isAdmin is true', () => {
      render(<SiteBanner siteTitle="Test" isAdmin={true} />)
      expect(screen.getByTestId('admin-settings-icon')).toBeDefined()
    })

    it('does not show gear icon when isAdmin is false', () => {
      render(<SiteBanner siteTitle="Test" isAdmin={false} />)
      expect(screen.queryByTestId('admin-settings-icon')).toBeNull()
    })

    it('does not show gear icon when isAdmin is undefined', () => {
      render(<SiteBanner siteTitle="Test" />)
      expect(screen.queryByTestId('admin-settings-icon')).toBeNull()
    })
  })
})
