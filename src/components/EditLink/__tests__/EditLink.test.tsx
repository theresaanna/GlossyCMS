import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { EditLink } from '../index'

vi.mock('@/utilities/getURL', () => ({
  getClientSideURL: () => 'http://localhost:3000',
}))

function mockFetchAuthenticated() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ user: { id: '1', email: 'admin@test.com' } }),
  })
}

function mockFetchUnauthenticated() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ user: null }),
  })
}

function mockFetchError() {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
}

describe('EditLink', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when user is not authenticated', async () => {
    mockFetchUnauthenticated()
    const { container } = render(<EditLink collection="pages" id="abc123" />)

    // Wait for the auth check to resolve
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(screen.queryByTestId('edit-link')).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when fetch fails', async () => {
    mockFetchError()
    const { container } = render(<EditLink collection="pages" id="abc123" />)

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(screen.queryByTestId('edit-link')).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('renders edit link for a pages collection document', async () => {
    mockFetchAuthenticated()
    render(<EditLink collection="pages" id="abc123" />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-link')).toBeDefined()
    })

    const link = screen.getByTestId('edit-link')
    expect(link.getAttribute('href')).toBe('/admin/collections/pages/abc123')
    expect(link.textContent).toContain('Edit this page')
  })

  it('renders correct href and label for posts collection', async () => {
    mockFetchAuthenticated()
    render(<EditLink collection="posts" id="post456" />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-link')).toBeDefined()
    })

    const link = screen.getByTestId('edit-link')
    expect(link.getAttribute('href')).toBe('/admin/collections/posts/post456')
    expect(link.textContent).toContain('Edit this post')
  })

  it('renders correct href for a global', async () => {
    mockFetchAuthenticated()
    render(<EditLink global="gallery-settings" />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-link')).toBeDefined()
    })

    const link = screen.getByTestId('edit-link')
    expect(link.getAttribute('href')).toBe('/admin/globals/gallery-settings')
    expect(link.textContent).toContain('Edit settings')
  })

  it('uses custom label when provided', async () => {
    mockFetchAuthenticated()
    render(<EditLink global="gallery-settings" label="Edit gallery settings" />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-link')).toBeDefined()
    })

    expect(screen.getByTestId('edit-link').textContent).toContain('Edit gallery settings')
  })

  it('renders nothing when neither collection/id nor global is provided', async () => {
    mockFetchAuthenticated()
    const { container } = render(<EditLink />)

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(screen.queryByTestId('edit-link')).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when collection is provided without id', async () => {
    mockFetchAuthenticated()
    const { container } = render(<EditLink collection="pages" />)

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    expect(screen.queryByTestId('edit-link')).toBeNull()
    expect(container.innerHTML).toBe('')
  })

  it('handles numeric id correctly', async () => {
    mockFetchAuthenticated()
    render(<EditLink collection="pages" id={42} />)

    await waitFor(() => {
      expect(screen.getByTestId('edit-link')).toBeDefined()
    })

    expect(screen.getByTestId('edit-link').getAttribute('href')).toBe('/admin/collections/pages/42')
  })

  it('calls the correct auth endpoint', async () => {
    mockFetchAuthenticated()
    render(<EditLink collection="pages" id="test" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/users/me', {
        credentials: 'include',
      })
    })
  })
})
