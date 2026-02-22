import type { TaskConfig } from 'payload'
import {
  createVercelProject,
  createVercelStorage,
  linkStorageToProject,
  setVercelEnvVars,
  addVercelDomain,
  triggerVercelDeploy,
  generateSecret,
} from '@/utilities/vercel-api'

// Blob storage is shared from the primary instance via BLOB_READ_WRITE_TOKEN
// rather than creating per-site stores (Vercel Blob has no Marketplace API).

const SOURCE_REPO = 'theresaanna/GlossyCMS'

export const provisionSiteTask: TaskConfig<{
  input: { siteId: number | string }
  output: { vercelProjectId: string }
}> = {
  slug: 'provision-site',
  label: 'Provision Site',
  inputSchema: [
    {
      name: 'siteId',
      type: 'number',
      required: true,
    },
  ],
  outputSchema: [
    {
      name: 'vercelProjectId',
      type: 'text',
    },
  ],
  retries: {
    attempts: 2,
    backoff: {
      delay: 5000,
      type: 'exponential',
    },
  },
  handler: async ({ input, req }) => {
    const { siteId } = input
    const site = await req.payload.findByID({
      collection: 'provisioned-sites',
      id: siteId,
      overrideAccess: true,
    })

    if (!site) {
      throw new Error(`Provisioned site ${siteId} not found.`)
    }

    const { subdomain, plan } = site
    const domain = `${subdomain}.glossysites.live`
    const projectName = `glossy-${subdomain}`
    const siteApiKey = generateSecret()

    // Fail early if required env vars are missing on the primary instance
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY is not set on the primary instance. ' +
          'Add it in Vercel project settings before provisioning new sites.',
      )
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN is not set on the primary instance. ' +
          'Add it in Vercel project settings before provisioning new sites.',
      )
    }

    // Update status to provisioning
    await req.payload.update({
      collection: 'provisioned-sites',
      id: siteId,
      overrideAccess: true,
      data: { status: 'provisioning' },
    })

    try {
      // 1. Create Vercel project with connected GitHub repo
      const project = await createVercelProject(projectName, SOURCE_REPO)

      // 2. Create Postgres database via Neon Marketplace integration
      const pgStore = await createVercelStorage('postgres', `${subdomain}-db`)

      // 3. Link postgres to project (auto-injects POSTGRES_URL)
      await linkStorageToProject(pgStore.id, project.id)

      // 4. Set environment variables (including shared blob token from primary instance)
      await setVercelEnvVars(project.id, {
        PAYLOAD_SECRET: generateSecret(),
        CRON_SECRET: generateSecret(),
        PREVIEW_SECRET: generateSecret(),
        RESEND_API_KEY: process.env.RESEND_API_KEY || '',
        BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || '',
        FROM_EMAIL: `hello@${domain}`,
        FROM_NAME: site.siteName || subdomain,
        SITE_NAME: site.siteName || subdomain,
        SITE_DESCRIPTION: site.siteDescription || 'A website powered by GlossyCMS.',
        NEXT_PUBLIC_SERVER_URL: `https://${domain}`,
        SITE_PLAN: plan || 'basic',
        NEXT_PUBLIC_SITE_PLAN: plan || 'basic',
        SITE_API_KEY: siteApiKey,
      })

      // 5. Add custom domain
      await addVercelDomain(project.id, domain)

      // 6. Trigger deployment
      await triggerVercelDeploy(project.id, project.link?.repoId)

      // 7. Update record to active
      await req.payload.update({
        collection: 'provisioned-sites',
        id: siteId,
        overrideAccess: true,
        data: {
          status: 'active',
          vercelProjectId: project.id,
          postgresStoreId: pgStore.id,
          siteApiKey,
          provisionedAt: new Date().toISOString(),
        },
      })

      return {
        output: { vercelProjectId: project.id },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      await req.payload.update({
        collection: 'provisioned-sites',
        id: siteId,
        overrideAccess: true,
        data: {
          status: 'failed',
          provisioningError: errorMessage,
        },
      })

      throw error
    }
  },
}
