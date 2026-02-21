import type { GalleryLayoutProps } from '@/themes/types'

export function GalleryLayout({ children }: GalleryLayoutProps) {
  return <div className="container mx-auto px-4 pt-4 pb-8">{children}</div>
}
