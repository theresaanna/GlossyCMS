import type { Metadata } from 'next/types'
import { notFound } from 'next/navigation'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'
import themeConfig from '@/theme.config'
import { SignupForm } from './SignupForm'

export default async function SignupPage() {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    notFound()
  }

  const { PageLayout } = themeConfig.layouts

  return (
    <PageLayout>
      <div className="container py-16">
        <div className="max-w-xl mx-auto">
          <div className="prose dark:prose-invert max-w-none mb-8">
            <h1>Create Your Site</h1>
            <p>
              Choose a subdomain and we&apos;ll set up your own GlossyCMS instance in about a
              minute.
            </p>
          </div>
          <SignupForm />
        </div>
      </div>
    </PageLayout>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `Sign Up | ${siteName}`,
    description: 'Create your own GlossyCMS site with a custom subdomain.',
  }
}
