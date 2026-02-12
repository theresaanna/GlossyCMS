import type { ThemeConfig } from '@/themes/types'
import { SiteLayout } from './SiteLayout'
import { PageLayout } from './PageLayout'
import { PostLayout } from './PostLayout'
import { ArchiveLayout } from './ArchiveLayout'
import { GalleryLayout } from './GalleryLayout'

import './tokens.css'

export const defaultTheme: ThemeConfig = {
  name: 'default',
  layouts: {
    SiteLayout,
    PageLayout,
    PostLayout,
    ArchiveLayout,
    GalleryLayout,
  },
}
