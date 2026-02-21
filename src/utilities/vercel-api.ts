import crypto from 'crypto'

const VERCEL_API_BASE = 'https://api.vercel.com'

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
    const { stores } = await listResponse.json()
    const existing = stores?.find(
      (s: { name: string; type: string }) => s.name === name && s.type === type,
    )
    if (existing) {
      return existing
    }
  }

  // Create new store
  const response = await vercelFetch('/v1/storage/stores', {
    method: 'POST',
    body: JSON.stringify({
      type,
      name,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create ${type} storage "${name}": ${JSON.stringify(error)}`)
  }

  return response.json()
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
