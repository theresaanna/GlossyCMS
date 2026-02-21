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

    const { subdomain } = site
    const domain = `${subdomain}.glossysites.live`
    const projectName = `glossy-${subdomain}`

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

      // 2. Create Postgres database
      const pgStore = await createVercelStorage('postgres', `${subdomain}-db`)

      // 3. Create Blob store
      const blobStore = await createVercelStorage('blob', `${subdomain}-blob`)

      // 4. Link storage to project (auto-injects POSTGRES_URL, BLOB_READ_WRITE_TOKEN)
      await linkStorageToProject(pgStore.id, project.id)
      await linkStorageToProject(blobStore.id, project.id)

      // 5. Set remaining environment variables
      await setVercelEnvVars(project.id, {
        PAYLOAD_SECRET: generateSecret(),
        CRON_SECRET: generateSecret(),
        PREVIEW_SECRET: generateSecret(),
        RESEND_API_KEY: process.env.RESEND_API_KEY || '',
        FROM_EMAIL: `hello@${domain}`,
        FROM_NAME: site.siteName || subdomain,
        SITE_NAME: site.siteName || subdomain,
        SITE_DESCRIPTION: site.siteDescription || 'A website powered by GlossyCMS.',
        NEXT_PUBLIC_SERVER_URL: `https://${domain}`,
      })

      // 6. Add custom domain
      await addVercelDomain(project.id, domain)

      // 7. Trigger deployment
      await triggerVercelDeploy(project.id)

      // 8. Update record to active
      await req.payload.update({
        collection: 'provisioned-sites',
        id: siteId,
        overrideAccess: true,
        data: {
          status: 'active',
          vercelProjectId: project.id,
          postgresStoreId: pgStore.id,
          blobStoreId: blobStore.id,
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
