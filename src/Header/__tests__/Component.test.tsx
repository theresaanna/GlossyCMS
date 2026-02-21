import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

const mockGetCachedGlobal = vi.fn()
vi.mock('@/utilities/getGlobals', () => ({
  getCachedGlobal: (...args: unknown[]) => mockGetCachedGlobal(...args),
}))

const mockGetMeUser = vi.fn()
vi.mock('@/utilities/getMeUser', () => ({
  getMeUser: () => mockGetMeUser(),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

vi.mock('@/providers/HeaderTheme', () => ({
  useHeaderTheme: () => ({ headerTheme: null, setHeaderTheme: vi.fn() }),
}))

vi.mock('@/utilities/getMediaUrl', () => ({
  getMediaUrl: (url: string | null | undefined) => url || '',
}))

import { Header } from '../Component'

async function renderServerComponent() {
  const jsx = await (Header as Function)()
  return render(jsx)
}

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedGlobal.mockReturnValue(() =>
      Promise.resolve({ navItems: [] }),
    )
  })

  it('passes isAdmin=true when user is logged in', async () => {
    mockGetMeUser.mockResolvedValueOnce({
      user: { id: 1, email: 'admin@example.com' },
      token: 'test-token',
    })

    const { container } = await renderServerComponent()
    const link = container.querySelector('a[href="/admin/globals/site-settings"]')
    expect(link).not.toBeNull()
  })

  it('passes isAdmin=false when getMeUser throws', async () => {
    mockGetMeUser.mockRejectedValueOnce(new Error('Not authenticated'))

    const { container } = await renderServerComponent()
    const adminLink = container.querySelector('a[href="/admin/globals/site-settings"]')
    expect(adminLink).toBeNull()
  })

  it('passes isAdmin=false when user is null', async () => {
    mockGetMeUser.mockResolvedValueOnce({
      user: null,
      token: null,
    })

    const { container } = await renderServerComponent()
    const adminLink = container.querySelector('a[href="/admin/globals/site-settings"]')
    expect(adminLink).toBeNull()
  })
})
