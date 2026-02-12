import type { SiteLayoutProps } from '@/themes/types'

export function SiteLayout({ adminBar, header, children, footer }: SiteLayoutProps) {
  return (
    <>
      {adminBar}
      {header}
      {children}
      {footer}
    </>
  )
}
