import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { resendAdapter } from '@payloadcms/email-resend'

import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { CommentVerificationTokens } from './collections/CommentVerificationTokens'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { NewsletterRecipients } from './collections/NewsletterRecipients'
import { Newsletters } from './collections/Newsletters'
import { ProvisionedSites } from './collections/ProvisionedSites'
import { AdultContent } from './AdultContent/config'
import { Footer } from './Footer/config'
import { Gallery } from './Gallery/config'
import { Header } from './Header/config'
import { SiteSettings } from './SiteSettings/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { provisionSiteTask } from './jobs/provision-site'
import { ensureHomePage } from './utilities/ensureHomePage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isPrimaryInstance = process.env.IS_PRIMARY_INSTANCE === 'true'
const resendKey = process.env.RESEND_API_KEY;
if (!resendKey && process.env.NODE_ENV === 'production') {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

export default buildConfig({
  admin: {
    meta: {
      icons: [
        { type: 'image/svg+xml', rel: 'icon', url: '/favicon.svg' },
        { type: 'image/x-icon', rel: 'icon', sizes: '32x32', url: '/favicon.ico' },
      ],
      titleSuffix: '- Glossy',
    },
    avatar: {
      Component: '@/components/AdminAvatar',
    },
    components: {
      actions: ['@/components/admin/ReportBugLink', '@/components/admin/ViewLiveSiteLink'],
      graphics: {
        Logo: '@/components/AdminLogo',
        Icon: '@/components/AdminIcon',
      },
      providers: ['@/components/AdminColorSchemeProvider'],
      ...(!isPrimaryInstance
        ? {
            afterNavLinks: ['@/components/admin/SubscriptionNavLink'],
            views: {
              subscription: {
                Component: '@/components/admin/SubscriptionView',
                path: '/subscription',
              },
            },
          }
        : {}),
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL,
      connectionTimeoutMillis: 10000,
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Comments,
    CommentVerificationTokens,
    NewsletterRecipients,
    Newsletters,
    ProvisionedSites,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  serverURL: getServerSideURL(),
  ...(resendKey
    ? {
        email: resendAdapter({
          apiKey: resendKey,
          defaultFromAddress: process.env.FROM_EMAIL || 'hello@example.com',
          defaultFromName: process.env.FROM_NAME || 'GlossyCMS',
        }),
      }
    : {}),
  globals: [Header, Footer, Gallery, AdultContent, SiteSettings],
  onInit: async (payload) => {
    await ensureHomePage(payload)
  },
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [provisionSiteTask],
  },
})
