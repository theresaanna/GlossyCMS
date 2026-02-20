import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock getPayload and configPromise before importing the component
const mockFindByID = vi.fn()
vi.mock('payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ findByID: mockFindByID })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import AdminAvatar from '../index'

/**
 * AdminAvatar is an async server component. To test it we call it as an
 * async function and render the resolved JSX element.
 */
async function renderServerComponent(props: Parameters<typeof AdminAvatar>[0]) {
  const jsx = await (AdminAvatar as Function)(props)
  return render(jsx)
}

describe('AdminAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindByID.mockReset()
  })

  it('renders user image when userImage is a populated object with thumbnail', async () => {
    await renderServerComponent({
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

    const img = screen.getByRole('img')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/media/thumb.jpg')
    expect(img.getAttribute('alt')).toBe('Jane')
  })

  it('falls back to full URL when thumbnail is not available on populated object', async () => {
    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: {
          url: '/media/full.jpg',
        },
      },
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/full.jpg')
  })

  it('fetches media by ID when userImage is a number', async () => {
    mockFindByID.mockResolvedValueOnce({
      url: '/media/fetched.jpg',
      sizes: { thumbnail: { url: '/media/fetched-thumb.jpg' } },
    })

    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    expect(mockFindByID).toHaveBeenCalledWith({
      collection: 'media',
      id: 42,
      depth: 0,
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/fetched-thumb.jpg')
  })

  it('falls back to full URL from fetched media when thumbnail is missing', async () => {
    mockFindByID.mockResolvedValueOnce({
      url: '/media/fetched-full.jpg',
    })

    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/fetched-full.jpg')
  })

  it('shows initial fallback when findByID throws for numeric ID', async () => {
    mockFindByID.mockRejectedValueOnce(new Error('Network error'))

    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    expect(screen.getByText('J')).toBeDefined()
  })

  it('shows initial fallback when findByID returns null', async () => {
    mockFindByID.mockResolvedValueOnce(null)

    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: 42,
      },
    })

    expect(screen.getByText('J')).toBeDefined()
  })

  it('renders initial fallback when no userImage is set', async () => {
    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: undefined,
      },
    })

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('J')).toBeDefined()
  })

  it('uses email initial when name is not available', async () => {
    await renderServerComponent({
      user: {
        name: null,
        email: 'alice@example.com',
        userImage: undefined,
      },
    })

    expect(screen.getByText('A')).toBeDefined()
  })

  it('uses "U" fallback when neither name nor email is available', async () => {
    await renderServerComponent({
      user: {
        name: null,
        email: null,
        userImage: undefined,
      },
    })

    expect(screen.getByText('U')).toBeDefined()
  })

  it('uses email for alt text when name is not available', async () => {
    await renderServerComponent({
      user: {
        name: null,
        email: 'alice@example.com',
        userImage: {
          url: '/media/photo.jpg',
        },
      },
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('alt')).toBe('alice@example.com')
  })

  it('handles userImage being null gracefully', async () => {
    await renderServerComponent({
      user: {
        name: 'Bob',
        email: 'bob@example.com',
        userImage: null,
      },
    })

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('B')).toBeDefined()
  })

  it('handles user being undefined gracefully', async () => {
    await renderServerComponent({
      user: undefined,
    })

    expect(screen.getByText('U')).toBeDefined()
  })

  it('renders image with circular styling', async () => {
    await renderServerComponent({
      user: {
        name: 'Jane',
        email: 'jane@example.com',
        userImage: {
          url: '/media/photo.jpg',
        },
      },
    })

    const img = screen.getByRole('img')
    expect(img.style.borderRadius).toBe('50%')
    expect(img.style.objectFit).toBe('cover')
  })

  it('prefers thumbnail size over full URL on populated object', async () => {
    await renderServerComponent({
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

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/thumbnail.jpg')
  })
})
