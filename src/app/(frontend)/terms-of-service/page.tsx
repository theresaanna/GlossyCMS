import type { Metadata } from 'next/types'
import { getSiteMetaDefaults } from '@/utilities/getSiteMetaDefaults'

export default function TermsOfServicePage() {
  return (
    <article className="pt-4 pb-24">
      <div className="container py-16">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Terms of Service</h1>
          <p>
            <strong>Last updated:</strong> March 1, 2026
          </p>

          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the GlossyCMS website
            hosting platform (&ldquo;Service&rdquo;) operated by GlossyCMS (&ldquo;we,&rdquo;
            &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By creating an account or using the Service,
            you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <h2>1. Account Registration</h2>
          <p>
            To use the Service, you must create an account and provide accurate, complete
            information. You are responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account. You must notify us
            immediately of any unauthorized use.
          </p>

          <h2>2. Acceptable Use</h2>
          <p>
            You agree to use the Service only for lawful purposes and in accordance with these
            Terms. You are solely responsible for all content you publish, upload, or make available
            through your site.
          </p>

          <h2>3. Prohibited Content and Conduct</h2>
          <p>
            You may not use the Service to create, store, distribute, or otherwise make available
            any content or material that:
          </p>
          <ol>
            <li>
              <strong>Illegal material:</strong> Violates any applicable local, state, national, or
              international law or regulation. This includes, without limitation, content that
              facilitates or promotes illegal activity of any kind.
            </li>
            <li>
              <strong>Child sexual abuse material (CSAM):</strong> Depicts, promotes, or facilitates
              the sexual exploitation or abuse of minors in any form. This includes real, digitally
              generated, or AI-generated imagery. We maintain a zero-tolerance policy and will
              immediately terminate accounts and report violations to the National Center for Missing
              &amp; Exploited Children (NCMEC) and applicable law enforcement authorities.
            </li>
            <li>
              <strong>Hate speech:</strong> Promotes violence, discrimination, harassment, or hatred
              against any individual or group based on race, ethnicity, national origin, religion,
              gender, gender identity, sexual orientation, disability, age, or any other protected
              characteristic.
            </li>
            <li>
              <strong>Harassment and threats:</strong> Threatens, bullies, intimidates, or harasses
              any person, including doxxing or publishing private information without consent.
            </li>
            <li>
              <strong>Terrorism and violent extremism:</strong> Promotes, supports, or glorifies
              terrorism, violent extremism, or acts of mass violence.
            </li>
            <li>
              <strong>Fraud and deception:</strong> Engages in phishing, scams, impersonation, or
              other deceptive practices intended to mislead or defraud others.
            </li>
            <li>
              <strong>Intellectual property infringement:</strong> Infringes on the copyrights,
              trademarks, patents, or other intellectual property rights of others.
            </li>
            <li>
              <strong>Malware and exploits:</strong> Distributes viruses, malware, spyware, or other
              harmful software, or uses the Service to conduct cyberattacks.
            </li>
            <li>
              <strong>Spam:</strong> Sends unsolicited messages, or uses the Service to facilitate
              spam distribution.
            </li>
          </ol>

          <h2>4. Enforcement</h2>
          <p>
            We reserve the right to review content hosted on the Service and to remove any content
            or suspend or terminate any account that violates these Terms, at our sole discretion and
            without prior notice. In cases involving illegal content, including but not limited to
            CSAM, we will cooperate fully with law enforcement authorities.
          </p>

          <h2>5. Content Ownership</h2>
          <p>
            You retain ownership of all content you create and publish through the Service. By using
            the Service, you grant us a limited license to host, store, and display your content
            solely for the purpose of operating and providing the Service.
          </p>

          <h2>6. Service Availability</h2>
          <p>
            We strive to provide reliable service but do not guarantee uninterrupted or error-free
            operation. We may modify, suspend, or discontinue any part of the Service at any time
            with reasonable notice.
          </p>

          <h2>7. Payment and Billing</h2>
          <p>
            Paid plans are billed on a recurring monthly basis. You authorize us to charge your
            payment method for the applicable fees. If payment fails, we may suspend your site until
            payment is resolved. Refunds are handled in accordance with our refund policy.
          </p>

          <h2>8. Termination</h2>
          <p>
            You may cancel your account at any time. We may terminate or suspend your account
            immediately, without prior notice, if you violate these Terms. Upon termination, your
            right to use the Service ceases immediately. We may delete your content after a
            reasonable retention period following termination.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including but not limited to implied
            warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits or
            revenue, whether incurred directly or indirectly, or any loss of data, use, goodwill, or
            other intangible losses, resulting from your use of the Service.
          </p>

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless GlossyCMS, its officers, directors, employees,
            and agents from any claims, damages, losses, or expenses (including reasonable
            attorney&apos;s fees) arising from your use of the Service or your violation of these
            Terms.
          </p>

          <h2>12. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you of material changes by
            posting the updated Terms on this page and updating the &ldquo;Last updated&rdquo; date.
            Your continued use of the Service after changes are posted constitutes your acceptance of
            the revised Terms.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable law, without
            regard to conflict of law principles.
          </p>

          <h2>14. Contact</h2>
          <p>
            If you have questions about these Terms or need to report a violation, please contact us
            at the email address associated with your account or through our website.
          </p>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteMetaDefaults()
  return {
    title: `Terms of Service | ${siteName}`,
    description: 'Terms of Service for the GlossyCMS website hosting platform.',
  }
}
