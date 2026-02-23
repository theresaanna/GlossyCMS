import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { teardownProvisionedSite } from '../teardownProvisionedSite'

vi.mock('../../../../utilities/vercel-api', () => ({
  deleteVercelProject: vi.fn(),
}))

vi.mock('../../../../utilities/neon-api', () => ({
  deleteNeonBranch: vi.fn(),
}))

import { deleteVercelProject } from '../../../../utilities/vercel-api'
import { deleteNeonBranch } from '../../../../utilities/neon-api'

const mockDeleteVercelProject = vi.mocked(deleteVercelProject)
const mockDeleteNeonBranch = vi.mocked(deleteNeonBranch)

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subdomain: 'test-site',
    ownerEmail: 'test@example.com',
    status: 'active' as const,
    vercelProjectId: 'prj_abc123',
    neonBranchId: 'br-test-456',
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
  process.env.NEON_TEMPLATE_PROJECT_ID = 'test-project-id'
})

afterEach(() => {
  delete process.env.NEON_TEMPLATE_PROJECT_ID
})

describe('teardownProvisionedSite', () => {
  // --- Vercel project deletion ---

  it('calls deleteVercelProject with the correct project ID', async () => {
    const doc = makeDoc()
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteVercelProject).toHaveBeenCalledWith('prj_abc123')
    expect(req.payload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Deleted Vercel project prj_abc123'),
    )
  })

  it('skips Vercel deletion when vercelProjectId is missing', async () => {
    const doc = makeDoc({ vercelProjectId: null })
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteVercelProject).not.toHaveBeenCalled()
  })

  it('skips Vercel deletion when vercelProjectId is empty string', async () => {
    const doc = makeDoc({ vercelProjectId: '' })
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteVercelProject).not.toHaveBeenCalled()
  })

  it('does not throw when deleteVercelProject fails', async () => {
    mockDeleteVercelProject.mockRejectedValue(new Error('API error'))
    const doc = makeDoc()
    const req = makeReq()

    const result = await teardownProvisionedSite({
      doc,
      req,
      id: 1,
      collection: {} as any,
      context: {},
    })

    expect(result).toBe(doc)
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete Vercel project prj_abc123'),
    )
  })

  // --- Neon branch deletion ---

  it('calls deleteNeonBranch with the correct project and branch IDs', async () => {
    const doc = makeDoc()
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteNeonBranch).toHaveBeenCalledWith('test-project-id', 'br-test-456')
    expect(req.payload.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Deleted Neon branch br-test-456'),
    )
  })

  it('skips Neon deletion when neonBranchId is missing', async () => {
    const doc = makeDoc({ neonBranchId: null })
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteNeonBranch).not.toHaveBeenCalled()
  })

  it('skips Neon deletion when NEON_TEMPLATE_PROJECT_ID is not set', async () => {
    delete process.env.NEON_TEMPLATE_PROJECT_ID
    const doc = makeDoc()
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    expect(mockDeleteNeonBranch).not.toHaveBeenCalled()
  })

  it('does not throw when deleteNeonBranch fails', async () => {
    mockDeleteNeonBranch.mockRejectedValue(new Error('Neon API error'))
    const doc = makeDoc()
    const req = makeReq()

    const result = await teardownProvisionedSite({
      doc,
      req,
      id: 1,
      collection: {} as any,
      context: {},
    })

    expect(result).toBe(doc)
    expect(req.payload.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to delete Neon branch br-test-456'),
    )
  })

  it('deletes both Vercel project and Neon branch independently', async () => {
    mockDeleteVercelProject.mockRejectedValue(new Error('Vercel error'))
    const doc = makeDoc()
    const req = makeReq()

    await teardownProvisionedSite({ doc, req, id: 1, collection: {} as any, context: {} })

    // Neon deletion should still be called even if Vercel deletion fails
    expect(mockDeleteNeonBranch).toHaveBeenCalledWith('test-project-id', 'br-test-456')
  })

  // --- General ---

  it('returns the deleted doc', async () => {
    const doc = makeDoc()
    const req = makeReq()

    const result = await teardownProvisionedSite({
      doc,
      req,
      id: 1,
      collection: {} as any,
      context: {},
    })

    expect(result).toBe(doc)
  })
})
