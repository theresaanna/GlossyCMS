import type { CollectionAfterDeleteHook } from 'payload'

import type { ProvisionedSite } from '../../../payload-types'
import { deleteVercelProject } from '../../../utilities/vercel-api'

export const teardownProvisionedSite: CollectionAfterDeleteHook<ProvisionedSite> = async ({
  doc,
  req: { payload },
}) => {
  if (!doc?.vercelProjectId) {
    return doc
  }

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

  return doc
}
