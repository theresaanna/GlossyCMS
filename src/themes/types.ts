import type { FC, ReactNode } from 'react'
import type { Page, Post } from '@/payload-types'

export interface SiteLayoutProps {
  children: ReactNode
  header: ReactNode
  footer: ReactNode
  adminBar: ReactNode
}

export interface PageLayoutProps {
  hero: Page['hero']
  blocks: Page['layout'][0][]
  auxiliaryContent?: ReactNode
}

export interface PostLayoutProps {
  post: Post
  auxiliaryContent?: ReactNode
}

export interface ArchiveLayoutProps {
  children: ReactNode
}

export interface GalleryLayoutProps {
  children: ReactNode
}

export interface ThemeConfig {
  name: string
  layouts: {
    SiteLayout: FC<SiteLayoutProps>
    PageLayout: FC<PageLayoutProps>
    PostLayout: FC<PostLayoutProps>
    ArchiveLayout: FC<ArchiveLayoutProps>
    GalleryLayout: FC<GalleryLayoutProps>
  }
}
