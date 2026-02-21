import type { Metadata } from 'next/types'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'
import themeConfig from '@/theme.config'
import { ProvisioningStatus } from './ProvisioningStatus'

type Args = {
  params: Promise<{ id: string }>
}

export default async function StatusPage({ params }: Args) {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    notFound()
  }

  const { id } = await params
  const numericId = Number(id)
  if (Number.isNaN(numericId)) {
    notFound()
  }

  const payload = await getPayload({ config: configPromise })

  let site
  try {
    site = await payload.findByID({
      collection: 'provisioned-sites',
      id: numericId,
      overrideAccess: true,
    })
  } catch {
    notFound()
  }

  if (!site) {
    notFound()
  }

  const { PageLayout } = themeConfig.layouts

  return (
    <PageLayout>
      <div className="container py-16">
        <div className="max-w-xl mx-auto">
          <ProvisioningStatus
            siteId={site.id}
            initialStatus={site.status}
            subdomain={site.subdomain}
            initialError={site.provisioningError || undefined}
          />
        </div>
      </div>
    </PageLayout>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `Setting Up Your Site | ${siteName}`,
  }
}
