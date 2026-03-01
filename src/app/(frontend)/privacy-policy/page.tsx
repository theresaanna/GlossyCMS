import type { Metadata } from 'next/types'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'

export default function PrivacyPolicyPage() {
  return (
    <article className="pt-4 pb-24">
      <div className="container py-16">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p>
            <strong>Last updated:</strong> March 1, 2026
          </p>

          <p>
            This Privacy Policy describes how GlossyCMS (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) collects, uses, and protects your information when you use our
            website hosting platform (&ldquo;Service&rdquo;).
          </p>

          <h2>1. Information We Collect</h2>
          <h3>Information you provide</h3>
          <ul>
            <li>
              <strong>Account information:</strong> When you sign up, we collect your email address,
              name, and chosen subdomain.
            </li>
            <li>
              <strong>Payment information:</strong> Payment details are processed by our third-party
              payment processor, Stripe. We do not store your full credit card number on our servers.
            </li>
            <li>
              <strong>Content:</strong> Any content you create, upload, or publish through your site.
            </li>
          </ul>

          <h3>Information collected automatically</h3>
          <ul>
            <li>
              <strong>Usage data:</strong> We collect information about how you interact with the
              Service, including pages visited, features used, and actions taken.
            </li>
            <li>
              <strong>Device and connection information:</strong> Browser type, operating system, IP
              address, and referring URLs.
            </li>
            <li>
              <strong>Cookies:</strong> We use cookies and similar technologies for authentication,
              preferences, and analytics. You can control cookies through your browser settings.
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain the Service</li>
            <li>Process payments and manage your subscription</li>
            <li>Send you important service-related communications</li>
            <li>Respond to your requests and provide support</li>
            <li>Monitor and improve the Service</li>
            <li>Detect and prevent fraud, abuse, and security issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>3. How We Share Your Information</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li>
              <strong>Service providers:</strong> Third parties that help us operate the Service,
              including hosting providers, payment processors, and analytics services.
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by law, or to protect our rights,
              safety, or property, or that of our users or the public.
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger, acquisition, or sale
              of assets, your information may be transferred as part of that transaction.
            </li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed to provide
            the Service. After account termination, we may retain certain information as required by
            law or for legitimate business purposes.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement reasonable technical and organizational measures to protect your information
            against unauthorized access, alteration, disclosure, or destruction. However, no method
            of transmission over the Internet is completely secure, and we cannot guarantee absolute
            security.
          </p>

          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to or restrict processing of your information</li>
            <li>Request a copy of your information in a portable format</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the information provided below.
          </p>

          <h2>7. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under the age of 13. We do not knowingly collect
            personal information from children under 13. If we become aware that we have collected
            such information, we will take steps to delete it promptly.
          </p>

          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the updated policy on this page and updating the &ldquo;Last
            updated&rdquo; date. Your continued use of the Service after changes are posted
            constitutes your acceptance of the revised policy.
          </p>

          <h2>9. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your rights, please
            contact us at the email address associated with your account or through our website.
          </p>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `Privacy Policy | ${siteName}`,
    description: 'Privacy Policy for the GlossyCMS website hosting platform.',
  }
}
