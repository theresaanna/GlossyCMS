import { neon } from '@neondatabase/serverless'

const NEON_API_BASE = 'https://console.neon.tech/api/v2'

function getNeonHeaders(): Record<string, string> {
  const key = process.env.NEON_API_KEY
  if (!key) {
    throw new Error('NEON_API_KEY environment variable is required for Neon branching.')
  }
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

function getTemplateProjectId(): string {
  const id = process.env.NEON_TEMPLATE_PROJECT_ID
  if (!id) {
    throw new Error(
      'NEON_TEMPLATE_PROJECT_ID environment variable is required for Neon branching.',
    )
  }
  return id
}

async function neonFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${NEON_API_BASE}${path}`
  return fetch(url, {
    ...options,
    headers: {
      ...getNeonHeaders(),
      ...(options.headers || {}),
    },
  })
}

export interface NeonBranchResult {
  branchId: string
  endpointHost: string
  connectionUri: string
}

/**
 * Create a Neon database branch from the template project.
 * Returns the branch ID and a connection URI for the new branch.
 */
export async function createNeonBranch(branchName: string): Promise<NeonBranchResult> {
  const projectId = getTemplateProjectId()
  const parentBranchId = process.env.NEON_TEMPLATE_BRANCH_ID || undefined
  const dbName = process.env.NEON_TEMPLATE_DB_NAME || 'neondb'
  const roleName = process.env.NEON_TEMPLATE_ROLE_NAME || 'neondb_owner'

  // 1. Create branch with a read-write endpoint
  const branchBody: Record<string, unknown> = {
    branch: {
      name: branchName,
      ...(parentBranchId ? { parent_id: parentBranchId } : {}),
    },
    endpoints: [{ type: 'read_write' }],
  }

  const createResponse = await neonFetch(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: JSON.stringify(branchBody),
  })

  if (!createResponse.ok) {
    const error = await createResponse.json()
    throw new Error(`Failed to create Neon branch "${branchName}": ${JSON.stringify(error)}`)
  }

  const createData = await createResponse.json()
  const branchId: string = createData.branch.id
  const endpointHost: string = createData.endpoints?.[0]?.host || ''

  // 2. Get the connection URI for the new branch
  const params = new URLSearchParams({
    branch_id: branchId,
    database_name: dbName,
    role_name: roleName,
  })

  const uriResponse = await neonFetch(
    `/projects/${projectId}/connection_uri?${params.toString()}`,
  )

  if (!uriResponse.ok) {
    const error = await uriResponse.json()
    throw new Error(
      `Failed to get connection URI for Neon branch "${branchId}": ${JSON.stringify(error)}`,
    )
  }

  const uriData = await uriResponse.json()
  let connectionUri: string = uriData.uri

  // Ensure sslmode=require is present
  if (!connectionUri.includes('sslmode=')) {
    connectionUri += connectionUri.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }

  return { branchId, endpointHost, connectionUri }
}

/**
 * Clean sensitive/user-specific data from a branched database while preserving
 * template content (pages, posts, media, categories) and migration state.
 */
export async function cleanBranchedDatabase(
  connectionUri: string,
  options: {
    siteName?: string
    siteDescription?: string
  },
): Promise<void> {
  const sql = neon(connectionUri)

  // TRUNCATE user-specific tables (CASCADE handles foreign key deps)
  await sql`TRUNCATE TABLE users CASCADE`
  await sql`TRUNCATE TABLE newsletter_recipients CASCADE`
  await sql`TRUNCATE TABLE comments CASCADE`
  await sql`TRUNCATE TABLE search CASCADE`
  await sql`TRUNCATE TABLE payload_locked_documents CASCADE`
  await sql`TRUNCATE TABLE payload_locked_documents_rels CASCADE`
  await sql`TRUNCATE TABLE payload_preferences CASCADE`
  await sql`TRUNCATE TABLE payload_preferences_rels CASCADE`

  // Reset site-specific settings; preserve color scheme choices
  await sql`
    UPDATE site_settings SET
      site_title = ${options.siteName || null},
      site_description = ${options.siteDescription || null},
      og_image_id = NULL,
      favicon_id = NULL,
      header_image_id = NULL,
      user_image_id = NULL
    WHERE id = 1
  `
}

/**
 * Delete a Neon branch. Used during teardown when a provisioned site is removed.
 */
export async function deleteNeonBranch(projectId: string, branchId: string): Promise<void> {
  const response = await neonFetch(`/projects/${projectId}/branches/${branchId}`, {
    method: 'DELETE',
  })

  // 404 means already deleted — not an error
  if (response.status === 404) {
    return
  }

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to delete Neon branch "${branchId}": ${JSON.stringify(error)}`)
  }
}
