import crypto from 'crypto'

const VERCEL_API_BASE = 'https://api.vercel.com'

// Maps our storage type names to Vercel Marketplace integration slugs
const INTEGRATION_SLUGS: Record<string, string> = {
  postgres: 'neon',
  blob: 'blob',
}

function getVercelHeaders(): Record<string, string> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    throw new Error('VERCEL_TOKEN environment variable is required for provisioning.')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function getTeamParam(): string {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ''
}

async function vercelFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${VERCEL_API_BASE}${path}${path.includes('?') ? '&' : '?'}${getTeamParam().replace('?', '')}`
  const response = await fetch(url.replace(/[?&]$/, ''), {
    ...options,
    headers: {
      ...getVercelHeaders(),
      ...(options.headers || {}),
    },
  })
  return response
}

// Cache for integration configurations to avoid repeated API calls
let cachedConfigurations: Array<{
  id: string
  slug: string
  integrationId: string
}> | null = null

async function getIntegrationConfigurations(): Promise<
  Array<{ id: string; slug: string; integrationId: string }>
> {
  if (cachedConfigurations) return cachedConfigurations

  const response = await vercelFetch('/v1/integrations/configurations?view=account')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to list integration configurations: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  cachedConfigurations = data
  return data
}

async function getIntegrationConfigId(integrationSlug: string): Promise<string> {
  const configurations = await getIntegrationConfigurations()
  const config = configurations.find((c) => c.slug === integrationSlug)
  if (!config) {
    throw new Error(
      `No "${integrationSlug}" integration found on your Vercel account. ` +
        `Install it from the Vercel Marketplace before provisioning.`,
    )
  }
  return config.id
}

// Cache for integration products keyed by configuration ID
const cachedProducts: Record<string, Array<{ id: string; slug: string; name: string }>> = {}

async function getIntegrationProductSlug(
  configId: string,
  type: 'postgres' | 'blob',
): Promise<string> {
  if (!cachedProducts[configId]) {
    const response = await vercelFetch(`/v1/integrations/configuration/${configId}/products`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to list integration products: ${JSON.stringify(error)}`)
    }
    const data = await response.json()
    cachedProducts[configId] = data.products || data
  }

  const products = cachedProducts[configId]

  // Find a product matching the storage type
  const product = products.find((p) => {
    const lower = (p.slug || p.name || '').toLowerCase()
    if (type === 'postgres') return lower.includes('postgres') || lower.includes('neon')
    if (type === 'blob') return lower.includes('blob')
    return false
  })

  if (!product) {
    throw new Error(
      `No ${type} product found for integration config "${configId}". ` +
        `Available products: ${products.map((p) => p.slug || p.name).join(', ')}`,
    )
  }

  return product.id || product.slug
}

export async function createVercelProject(
  name: string,
  gitRepo?: string,
): Promise<{ id: string; name: string }> {
  const body: Record<string, unknown> = {
    name,
    framework: 'nextjs',
  }

  if (gitRepo) {
    body.gitRepository = {
      type: 'github',
      repo: gitRepo,
    }
  }

  const response = await vercelFetch('/v10/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    // Project may already exist
    if (error.error?.code === 'project_already_exists') {
      const existing = await getVercelProject(name)
      return existing
    }
    throw new Error(`Failed to create Vercel project: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export async function getVercelProject(name: string): Promise<{ id: string; name: string }> {
  const response = await vercelFetch(`/v9/projects/${encodeURIComponent(name)}`)
  if (!response.ok) {
    throw new Error(`Failed to get Vercel project: ${response.statusText}`)
  }
  return response.json()
}

export async function createVercelStorage(
  type: 'postgres' | 'blob',
  name: string,
): Promise<{ id: string; connectionString?: string; token?: string }> {
  // Check if store already exists
  const listResponse = await vercelFetch('/v1/storage/stores')
  if (listResponse.ok) {
    const data = await listResponse.json()
    const stores = data.stores || data
    const existing = (stores as Array<{ name: string; type: string; id: string }>)?.find(
      (s) => s.name === name,
    )
    if (existing) {
      return existing
    }
  }

  // Discover the integration configuration and product for this storage type
  const integrationSlug = INTEGRATION_SLUGS[type]
  if (!integrationSlug) {
    throw new Error(`Unsupported storage type: ${type}`)
  }

  const configId = await getIntegrationConfigId(integrationSlug)
  const productSlug = await getIntegrationProductSlug(configId, type)

  // Build metadata required by certain integrations (e.g. Neon requires a region)
  const metadata: Record<string, string> = {}
  if (type === 'postgres') {
    metadata.region = process.env.NEON_REGION || 'aws-us-east-1'
  }

  // Create new store via the Marketplace integration endpoint
  const response = await vercelFetch('/v1/storage/stores/integration/direct', {
    method: 'POST',
    body: JSON.stringify({
      name,
      integrationConfigurationId: configId,
      integrationProductIdOrSlug: productSlug,
      ...(Object.keys(metadata).length > 0 && { metadata }),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create ${type} storage "${name}": ${JSON.stringify(error)}`)
  }

  const result = await response.json()
  // The integration endpoint wraps the store in a `store` property
  return result.store || result
}

export async function linkStorageToProject(storeId: string, projectId: string): Promise<void> {
  const response = await vercelFetch(`/v1/storage/stores/${storeId}/connections`, {
    method: 'POST',
    body: JSON.stringify({
      projectId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    // Already linked is not an error
    if (error.error?.code === 'already_connected') {
      return
    }
    throw new Error(`Failed to link storage to project: ${JSON.stringify(error)}`)
  }
}

export async function setVercelEnvVars(
  projectId: string,
  vars: Record<string, string>,
): Promise<void> {
  // Vercel API supports bulk env var creation
  const envVars = Object.entries(vars).map(([key, value]) => ({
    key,
    value,
    type: 'encrypted' as const,
    target: ['production', 'preview', 'development'],
  }))

  const response = await vercelFetch(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify(envVars),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to set environment variables: ${JSON.stringify(error)}`)
  }
}

export async function addVercelDomain(projectId: string, domain: string): Promise<void> {
  const response = await vercelFetch(`/v10/projects/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  })

  if (!response.ok) {
    const error = await response.json()
    // Domain already added is not an error
    if (error.error?.code === 'domain_already_in_use') {
      return
    }
    throw new Error(`Failed to add domain "${domain}": ${JSON.stringify(error)}`)
  }
}

export async function triggerVercelDeploy(projectId: string): Promise<{ id: string }> {
  const response = await vercelFetch('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: projectId,
      project: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        ref: 'main',
        repoId: '', // Will use the connected repo
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to trigger deployment: ${JSON.stringify(error)}`)
  }

  return response.json()
}

export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}
