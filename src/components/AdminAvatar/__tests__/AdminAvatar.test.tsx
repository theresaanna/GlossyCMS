import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockUseAuth = vi.fn()

vi.mock('@payloadcms/ui', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import AdminAvatar from '../index'

describe('AdminAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders user image when userImage is a populated object with thumbnail', () => {
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

  it('falls back to full URL when thumbnail is not available on populated object', () => {
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

  it('fetches media by ID when userImage is a number', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: '/media/fetched.jpg',
        sizes: { thumbnail: { url: '/media/fetched-thumb.jpg' } },
      }),
    })

    render(<AdminAvatar />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/media/42')
    })

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img.getAttribute('src')).toBe('/media/fetched-thumb.jpg')
    })
  })

  it('falls back to full URL from fetched media when thumbnail is missing', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: '/media/fetched-full.jpg',
      }),
    })

    render(<AdminAvatar />)

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img.getAttribute('src')).toBe('/media/fetched-full.jpg')
    })
  })

  it('shows initial fallback when fetch fails for numeric ID', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<AdminAvatar />)

    await waitFor(() => {
      expect(screen.getByText('J')).toBeDefined()
    })
  })

  it('shows initial fallback when fetch returns non-ok response', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
    })

    render(<AdminAvatar />)

    await waitFor(() => {
      expect(screen.getByText('J')).toBeDefined()
    })
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

  it('prefers thumbnail size over full URL on populated object', () => {
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
