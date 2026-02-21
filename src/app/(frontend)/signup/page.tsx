import type { Metadata } from 'next/types'
import { notFound } from 'next/navigation'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'
import { SignupForm } from './SignupForm'

export default async function SignupPage() {
  if (process.env.IS_PRIMARY_INSTANCE !== 'true') {
    notFound()
  }

  return (
    <article className="pt-4 pb-24">
      <div className="container py-16">
        <div className="max-w-xl mx-auto">
          <SignupForm />
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `Sign Up | ${siteName}`,
    description: 'Create your own GlossyCMS site with a custom subdomain.',
  }
}
