import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '../index'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/components/Media', () => ({
  Media: () => <div data-testid="media" />,
}))

describe('Card', () => {
  describe('URL generation', () => {
    it('links to /posts/{slug} for posts', () => {
      render(
        <Card
          doc={{ slug: 'my-post', title: 'My Post', categories: [], meta: {} }}
          relationTo="posts"
        />,
      )

      const link = screen.getByText('My Post').closest('a')
      expect(link?.getAttribute('href')).toBe('/posts/my-post')
    })

    it('links to /{slug} for pages', () => {
      render(
        <Card
          doc={{ slug: 'about', title: 'About Us', categories: [], meta: {} }}
          relationTo="pages"
        />,
      )

      const link = screen.getByText('About Us').closest('a')
      expect(link?.getAttribute('href')).toBe('/about')
    })
  })
})
