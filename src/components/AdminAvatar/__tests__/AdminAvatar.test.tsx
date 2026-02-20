import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock getPayload and configPromise before importing the component
const mockFindGlobal = vi.fn()
vi.mock('payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ findGlobal: mockFindGlobal })),
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
    mockFindGlobal.mockReset()
  })

  it('renders user image when site-settings has a populated userImage with thumbnail', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      userImage: {
        url: '/media/full.jpg',
        sizes: {
          thumbnail: { url: '/media/thumb.jpg' },
        },
      },
    })

    await renderServerComponent({
      user: { name: 'Jane', email: 'jane@example.com' },
    })

    expect(mockFindGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 1,
    })
    const img = screen.getByRole('img')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/media/thumb.jpg')
    expect(img.getAttribute('alt')).toBe('Jane')
  })

  it('falls back to full URL when thumbnail is not available', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      userImage: {
        url: '/media/full.jpg',
      },
    })

    await renderServerComponent({
      user: { name: 'Jane', email: 'jane@example.com' },
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/full.jpg')
  })

  it('shows initial fallback when findGlobal throws', async () => {
    mockFindGlobal.mockRejectedValueOnce(new Error('Network error'))

    await renderServerComponent({
      user: { name: 'Jane', email: 'jane@example.com' },
    })

    expect(screen.getByText('J')).toBeDefined()
  })

  it('shows initial fallback when site-settings has no userImage', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      userImage: null,
    })

    await renderServerComponent({
      user: { name: 'Jane', email: 'jane@example.com' },
    })

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('J')).toBeDefined()
  })

  it('uses email initial when name is not available', async () => {
    mockFindGlobal.mockResolvedValueOnce({ userImage: null })

    await renderServerComponent({
      user: { name: null, email: 'alice@example.com' },
    })

    expect(screen.getByText('A')).toBeDefined()
  })

  it('uses "U" fallback when neither name nor email is available', async () => {
    mockFindGlobal.mockResolvedValueOnce({ userImage: null })

    await renderServerComponent({
      user: { name: null, email: null },
    })

    expect(screen.getByText('U')).toBeDefined()
  })

  it('uses email for alt text when name is not available', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      userImage: {
        url: '/media/photo.jpg',
      },
    })

    await renderServerComponent({
      user: { name: null, email: 'alice@example.com' },
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('alt')).toBe('alice@example.com')
  })

  it('handles user being undefined gracefully', async () => {
    mockFindGlobal.mockResolvedValueOnce({ userImage: null })

    await renderServerComponent({
      user: undefined,
    })

    expect(screen.getByText('U')).toBeDefined()
  })

  it('renders image with circular styling', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      userImage: {
        url: '/media/photo.jpg',
      },
    })

    await renderServerComponent({
      user: { name: 'Jane', email: 'jane@example.com' },
    })

    const img = screen.getByRole('img')
    expect(img.style.borderRadius).toBe('50%')
    expect(img.style.objectFit).toBe('cover')
  })

  it('prefers thumbnail size over full URL', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      userImage: {
        url: '/media/full-res.jpg',
        sizes: {
          thumbnail: { url: '/media/thumbnail.jpg' },
        },
      },
    })

    await renderServerComponent({
      user: { name: 'Jane', email: 'jane@example.com' },
    })

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toBe('/media/thumbnail.jpg')
  })
})
