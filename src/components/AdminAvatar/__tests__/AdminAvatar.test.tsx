import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseAuth = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  useAuth: () => mockUseAuth(),
}))

import AdminAvatar from '../index'

describe('AdminAvatar', () => {
  it('renders user image when userImage has a thumbnail URL', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: {
          url: '/media/full.jpg',
          sizes: {
            thumbnail: { url: '/media/thumb.jpg' },
          },
        },
      },
    })

    render(<AdminAvatar />)

    const img = screen.getByRole('img')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/media/thumb.jpg')
    expect(img.getAttribute('alt')).toBe('Jane')
  })

  it('falls back to full URL when thumbnail is not available', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: {
          url: '/media/full.jpg',
        },
      },
    })

    render(<AdminAvatar />)

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/full.jpg')
  })

  it('renders initial fallback when no userImage is set', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: undefined,
      },
    })

    render(<AdminAvatar />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('J')).toBeDefined()
  })

  it('uses email initial when name is not available', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: null,
        email: 'alice@example.com',
        userImage: undefined,
      },
    })

    render(<AdminAvatar />)

    expect(screen.getByText('A')).toBeDefined()
  })

  it('uses "U" fallback when neither name nor email is available', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: null,
        email: null,
        userImage: undefined,
      },
    })

    render(<AdminAvatar />)

    expect(screen.getByText('U')).toBeDefined()
  })

  it('uses email for alt text when name is not available', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: null,
        email: 'alice@example.com',
        userImage: {
          url: '/media/photo.jpg',
        },
      },
    })

    render(<AdminAvatar />)

    const img = screen.getByRole('img')
    expect(img.getAttribute('alt')).toBe('alice@example.com')
  })

  it('handles userImage being null gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Bob',
        email: 'bob@example.com',
        userImage: null,
      },
    })

    render(<AdminAvatar />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('B')).toBeDefined()
  })

  it('handles user being undefined gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: undefined,
    })

    render(<AdminAvatar />)

    expect(screen.getByText('U')).toBeDefined()
  })

  it('renders image with circular styling', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: {
          url: '/media/photo.jpg',
        },
      },
    })

    render(<AdminAvatar />)

    const img = screen.getByRole('img')
    expect(img.style.borderRadius).toBe('50%')
    expect(img.style.objectFit).toBe('cover')
  })

  it('prefers thumbnail size over full URL', () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: {
          url: '/media/full-res.jpg',
          sizes: {
            thumbnail: { url: '/media/thumbnail.jpg' },
          },
        },
      },
    })

    render(<AdminAvatar />)

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/thumbnail.jpg')
  })
})
