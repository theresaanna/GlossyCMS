import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CMSLink } from '../index'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('CMSLink', () => {
  describe('gallery type', () => {
    it('renders a link to /gallery when type is gallery', () => {
      render(<CMSLink type="gallery" label="Gallery" />)

      const link = screen.getByText('Gallery')
      expect(link.closest('a')?.getAttribute('href')).toBe('/gallery')
    })

    it('renders gallery link regardless of url or reference props', () => {
      render(
        <CMSLink
          type="gallery"
          label="Photos"
          url="/some-other-url"
          reference={{ relationTo: 'pages', value: { slug: 'test' } as any }}
        />,
      )

      const link = screen.getByText('Photos')
      expect(link.closest('a')?.getAttribute('href')).toBe('/gallery')
    })

    it('renders gallery link with newTab props when enabled', () => {
      render(<CMSLink type="gallery" label="Gallery" newTab />)

      const link = screen.getByText('Gallery').closest('a')
      expect(link?.getAttribute('target')).toBe('_blank')
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })

  describe('reference type', () => {
    it('renders link to page slug', () => {
      render(
        <CMSLink
          type="reference"
          label="About"
          reference={{ relationTo: 'pages', value: { slug: 'about' } as any }}
        />,
      )

      const link = screen.getByText('About')
      expect(link.closest('a')?.getAttribute('href')).toBe('/about')
    })

    it('renders link to post with /posts/ prefix', () => {
      render(
        <CMSLink
          type="reference"
          label="My Post"
          reference={{ relationTo: 'posts', value: { slug: 'my-post' } as any }}
        />,
      )

      const link = screen.getByText('My Post')
      expect(link.closest('a')?.getAttribute('href')).toBe('/posts/my-post')
    })
  })

  describe('custom type', () => {
    it('renders link to custom URL', () => {
      render(<CMSLink type="custom" label="External" url="https://example.com" />)

      const link = screen.getByText('External')
      expect(link.closest('a')?.getAttribute('href')).toBe('https://example.com')
    })
  })

  describe('null/missing href', () => {
    it('returns null when no href can be resolved', () => {
      const { container } = render(<CMSLink type="reference" label="Broken" />)

      expect(container.innerHTML).toBe('')
    })
  })
})
