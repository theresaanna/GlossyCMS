import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetPayload = vi.fn()
vi.mock('payload', () => ({
  getPayload: () => mockGetPayload(),
}))

vi.mock('@payload-config', () => ({ default: {} }))

import { GET } from '../route'

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    findByID: vi.fn().mockResolvedValue(null),
    jobs: {
      queue: vi.fn().mockResolvedValue({}),
      run: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  }
}

function makeSite(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subdomain: 'test-site',
    status: 'active' as const,
    provisioningError: null,
    provisionedAt: '2026-03-04T00:00:00.000Z',
    ...overrides,
  }
}

function makeRequest(id: string) {
  return [
    new Request(`http://localhost/api/provisioning/status/${id}`),
    { params: Promise.resolve({ id }) },
  ] as const
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('IS_PRIMARY_INSTANCE', 'true')
})

describe('GET /api/provisioning/status/[id]', () => {
  it('returns 404 when not primary instance', async () => {
    vi.stubEnv('IS_PRIMARY_INSTANCE', 'false')

    const res = await GET(...makeRequest('1'))
    expect(res.status).toBe(404)
  })

  it('returns 400 for non-numeric id', async () => {
    const res = await GET(...makeRequest('abc'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid ID' })
  })

  it('returns 404 when site not found', async () => {
    const mockPayload = makePayload()
    mockPayload.findByID.mockRejectedValue(new Error('Not Found'))
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await GET(...makeRequest('999'))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Site not found' })
  })

  it('returns site status for non-pending sites', async () => {
    const site = makeSite({ status: 'active', subdomain: 'my-site' })
    const mockPayload = makePayload()
    mockPayload.findByID.mockResolvedValue(site)
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await GET(...makeRequest('1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('active')
    expect(data.subdomain).toBe('my-site')
    expect(data.provisioningError).toBeUndefined()
  })

  it('includes provisioningError for failed sites', async () => {
    const site = makeSite({
      status: 'failed',
      provisioningError: 'Vercel API error',
    })
    const mockPayload = makePayload()
    mockPayload.findByID.mockResolvedValue(site)
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await GET(...makeRequest('1'))
    const data = await res.json()
    expect(data.status).toBe('failed')
    expect(data.provisioningError).toBe('Vercel API error')
  })

  it('queues and runs provisioning job for pending sites', async () => {
    const pendingSite = makeSite({ id: 42, status: 'pending', subdomain: 'new-site' })
    const activeSite = makeSite({ id: 42, status: 'active', subdomain: 'new-site' })
    const mockPayload = makePayload()
    mockPayload.findByID
      .mockResolvedValueOnce(pendingSite)
      .mockResolvedValueOnce(activeSite)
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await GET(...makeRequest('42'))
    expect(res.status).toBe(200)

    expect(mockPayload.jobs.queue).toHaveBeenCalledWith({
      task: 'provision-site',
      input: { siteId: 42 },
    })
    expect(mockPayload.jobs.run).toHaveBeenCalled()

    const data = await res.json()
    expect(data.status).toBe('active')
  })

  it('returns updated status after job runs for pending sites', async () => {
    const pendingSite = makeSite({ id: 5, status: 'pending' })
    const failedSite = makeSite({
      id: 5,
      status: 'failed',
      provisioningError: 'Neon branch creation failed',
    })
    const mockPayload = makePayload()
    mockPayload.findByID
      .mockResolvedValueOnce(pendingSite)
      .mockResolvedValueOnce(failedSite)
    mockGetPayload.mockResolvedValue(mockPayload)

    const res = await GET(...makeRequest('5'))
    const data = await res.json()
    expect(data.status).toBe('failed')
    expect(data.provisioningError).toBe('Neon branch creation failed')
  })

  it('does not queue or run jobs for non-pending statuses', async () => {
    const site = makeSite({ status: 'provisioning' })
    const mockPayload = makePayload()
    mockPayload.findByID.mockResolvedValue(site)
    mockGetPayload.mockResolvedValue(mockPayload)

    await GET(...makeRequest('1'))

    expect(mockPayload.jobs.queue).not.toHaveBeenCalled()
    expect(mockPayload.jobs.run).not.toHaveBeenCalled()
  })
})
