import type { CollectionAfterDeleteHook } from 'payload'

import type { ProvisionedSite } from '../../../payload-types'
import { deleteVercelProject } from '../../../utilities/vercel-api'
import { deleteNeonBranch } from '../../../utilities/neon-api'

export const teardownProvisionedSite: CollectionAfterDeleteHook<ProvisionedSite> = async ({
  doc,
  req: { payload },
}) => {
  // Delete Vercel project
  if (doc?.vercelProjectId) {
    try {
      await deleteVercelProject(doc.vercelProjectId)
      payload.logger.info(
        `Deleted Vercel project ${doc.vercelProjectId} for site "${doc.subdomain}"`,
      )
    } catch (error) {
      payload.logger.error(
        `Failed to delete Vercel project ${doc.vercelProjectId} for site "${doc.subdomain}": ${error}`,
      )
    }
  }

  // Delete Neon database branch
  if (doc?.neonBranchId && process.env.NEON_TEMPLATE_PROJECT_ID) {
    try {
      await deleteNeonBranch(process.env.NEON_TEMPLATE_PROJECT_ID, doc.neonBranchId)
      payload.logger.info(
        `Deleted Neon branch ${doc.neonBranchId} for site "${doc.subdomain}"`,
      )
    } catch (error) {
      payload.logger.error(
        `Failed to delete Neon branch ${doc.neonBranchId} for site "${doc.subdomain}": ${error}`,
      )
    }
  }

  return doc
}
