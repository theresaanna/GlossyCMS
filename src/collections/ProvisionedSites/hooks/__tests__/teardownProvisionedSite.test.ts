import { describe, it, expect, vi, beforeEach } from 'vitest'
import { teardownProvisionedSite } from '../teardownProvisionedSite'

vi.mock('../../../../utilities/vercel-api', () => ({
  deleteVercelProject: vi.fn(),
}))

import { deleteVercelProject } from '../../../../utilities/vercel-api'

const mockDeleteVercelProject = vi.mocked(deleteVercelProject)

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subdomain: 'test-site',
    ownerEmail: 'test@example.com',
    status: 'active' as const,
    vercelProjectId: 'prj_abc123',
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeReq() {
  return {
    payload: {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
    },
    context: {},
  } as any
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('teardownProvisionedSite', () => {
  it('calls deleteVercelProject with the correct project ID', async () => {
    const doc = makeDoc()
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteVercelProject).toHaveBeenCalledWith('prj_abc123')
    expect(req.payload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Deleted Vercel project prj_abc123'),
    )
  })

  it('skips deletion when vercelProjectId is missing', async () => {
    const doc = makeDoc({ vercelProjectId: null })
    const req = makeReq()

    const result = await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteVercelProject).not.toHaveBeenCalled()
    expect(result).toBe(doc)
  })

  it('skips deletion when vercelProjectId is empty string', async () => {
    const doc = makeDoc({ vercelProjectId: '' })
    const req = makeReq()

    const result = await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteVercelProject).not.toHaveBeenCalled()
    expect(result).toBe(doc)
  })

  it('does not throw when deleteVercelProject fails', async () => {
    mockDeleteVercelProject.mockRejectedValue(new Error('API error'))
    const doc = makeDoc()
    const req = makeReq()

    const result = await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(result).toBe(doc)
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete Vercel project prj_abc123'),
    )
  })

  it('returns the deleted doc', async () => {
    const doc = makeDoc()
    const req = makeReq()

    const result = await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(result).toBe(doc)
  })
})
