import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createNeonBranch, cleanBranchedDatabase, deleteNeonBranch } from '../neon-api'

// Mock @neondatabase/serverless
const mockSql = vi.fn().mockResolvedValue([])
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSql),
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()

  // Default env vars for most tests
  process.env.NEON_API_KEY = 'test-api-key'
  process.env.NEON_TEMPLATE_PROJECT_ID = 'test-project-id'
  delete process.env.NEON_TEMPLATE_BRANCH_ID
  delete process.env.NEON_TEMPLATE_DB_NAME
  delete process.env.NEON_TEMPLATE_ROLE_NAME
})

afterEach(() => {
  delete process.env.NEON_API_KEY
  delete process.env.NEON_TEMPLATE_PROJECT_ID
  delete process.env.NEON_TEMPLATE_BRANCH_ID
  delete process.env.NEON_TEMPLATE_DB_NAME
  delete process.env.NEON_TEMPLATE_ROLE_NAME
})

describe('createNeonBranch', () => {
  const mockBranchResponse = {
    branch: { id: 'br-test-123' },
    endpoints: [{ host: 'ep-test-123.us-east-2.aws.neon.tech' }],
  }

  const mockUriResponse = {
    uri: 'postgresql://user:pass@ep-test-123.us-east-2.aws.neon.tech/neondb?sslmode=require',
  }

  function setupSuccessfulFetch() {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBranchResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUriResponse),
      })
  }

  it('creates a branch and returns the result', async () => {
    setupSuccessfulFetch()

    const result = await createNeonBranch('glossy-testsite')

    expect(result).toEqual({
      branchId: 'br-test-123',
      endpointHost: 'ep-test-123.us-east-2.aws.neon.tech',
      connectionUri:
        'postgresql://user:pass@ep-test-123.us-east-2.aws.neon.tech/neondb?sslmode=require',
    })
  })

  it('sends correct branch creation request', async () => {
    setupSuccessfulFetch()

    await createNeonBranch('glossy-testsite')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://console.neon.tech/api/v2/projects/test-project-id/branches',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          branch: { name: 'glossy-testsite' },
          endpoints: [{ type: 'read_write' }],
        }),
      }),
    )
  })

  it('includes parent_id when NEON_TEMPLATE_BRANCH_ID is set', async () => {
    process.env.NEON_TEMPLATE_BRANCH_ID = 'br-parent-456'
    setupSuccessfulFetch()

    await createNeonBranch('glossy-testsite')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.branch.parent_id).toBe('br-parent-456')
  })

  it('uses custom db name and role name from env vars', async () => {
    process.env.NEON_TEMPLATE_DB_NAME = 'custom_db'
    process.env.NEON_TEMPLATE_ROLE_NAME = 'custom_role'
    setupSuccessfulFetch()

    await createNeonBranch('glossy-testsite')

    const uriUrl = mockFetch.mock.calls[1][0] as string
    expect(uriUrl).toContain('database_name=custom_db')
    expect(uriUrl).toContain('role_name=custom_role')
  })

  it('appends sslmode=require if missing from URI', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBranchResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            uri: 'postgresql://user:pass@host/neondb',
          }),
      })

    const result = await createNeonBranch('glossy-testsite')
    expect(result.connectionUri).toBe('postgresql://user:pass@host/neondb?sslmode=require')
  })

  it('does not duplicate sslmode if already present', async () => {
    setupSuccessfulFetch()

    const result = await createNeonBranch('glossy-testsite')
    expect(result.connectionUri).not.toContain('sslmode=require&sslmode=require')
  })

  it('throws when NEON_API_KEY is missing', async () => {
    delete process.env.NEON_API_KEY

    await expect(createNeonBranch('test')).rejects.toThrow('NEON_API_KEY')
  })

  it('throws when NEON_TEMPLATE_PROJECT_ID is missing', async () => {
    delete process.env.NEON_TEMPLATE_PROJECT_ID

    await expect(createNeonBranch('test')).rejects.toThrow('NEON_TEMPLATE_PROJECT_ID')
  })

  it('throws when branch creation API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'quota exceeded' }),
    })

    await expect(createNeonBranch('test')).rejects.toThrow('Failed to create Neon branch')
  })

  it('throws when connection URI API fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBranchResponse),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'not found' }),
      })

    await expect(createNeonBranch('test')).rejects.toThrow('Failed to get connection URI')
  })

  it('includes authorization header in requests', async () => {
    setupSuccessfulFetch()

    await createNeonBranch('glossy-testsite')

    for (const call of mockFetch.mock.calls) {
      expect(call[1].headers).toMatchObject({
        Authorization: 'Bearer test-api-key',
      })
    }
  })
})

describe('cleanBranchedDatabase', () => {
  const testUri = 'postgresql://user:pass@host/neondb?sslmode=require'

  it('truncates sensitive tables', async () => {
    await cleanBranchedDatabase(testUri, { siteName: 'My Site' })

    const calls = mockSql.mock.calls
    const sqlStatements = calls.map((call: unknown[]) => {
      // Tagged template literals pass strings array as first arg
      const strings = call[0] as string[]
      return strings.join('').trim()
    })

    expect(sqlStatements).toContainEqual(expect.stringContaining('TRUNCATE TABLE users'))
    expect(sqlStatements).toContainEqual(
      expect.stringContaining('TRUNCATE TABLE newsletter_recipients'),
    )
    expect(sqlStatements).toContainEqual(expect.stringContaining('TRUNCATE TABLE comments'))
    expect(sqlStatements).toContainEqual(expect.stringContaining('TRUNCATE TABLE search'))
    expect(sqlStatements).toContainEqual(
      expect.stringContaining('TRUNCATE TABLE payload_locked_documents CASCADE'),
    )
    expect(sqlStatements).toContainEqual(
      expect.stringContaining('TRUNCATE TABLE payload_locked_documents_rels'),
    )
    expect(sqlStatements).toContainEqual(
      expect.stringContaining('TRUNCATE TABLE payload_preferences CASCADE'),
    )
    expect(sqlStatements).toContainEqual(
      expect.stringContaining('TRUNCATE TABLE payload_preferences_rels'),
    )
  })

  it('updates site_settings with provided name and description', async () => {
    await cleanBranchedDatabase(testUri, {
      siteName: 'My Site',
      siteDescription: 'A cool site',
    })

    const calls = mockSql.mock.calls
    const updateCall = calls.find((call: unknown[]) => {
      const strings = call[0] as string[]
      return strings.join('').includes('UPDATE site_settings')
    })

    expect(updateCall).toBeDefined()
  })

  it('does not truncate payload_migrations', async () => {
    await cleanBranchedDatabase(testUri, {})

    const calls = mockSql.mock.calls
    const sqlStatements = calls.map((call: unknown[]) => {
      const strings = call[0] as string[]
      return strings.join('')
    })

    const migrationsStatement = sqlStatements.find((s: string) =>
      s.includes('payload_migrations'),
    )
    expect(migrationsStatement).toBeUndefined()
  })

  it('passes null for missing siteName and siteDescription', async () => {
    await cleanBranchedDatabase(testUri, {})

    // The update call should still execute (with null values)
    const calls = mockSql.mock.calls
    const updateCall = calls.find((call: unknown[]) => {
      const strings = call[0] as string[]
      return strings.join('').includes('UPDATE site_settings')
    })

    expect(updateCall).toBeDefined()
  })
})

describe('deleteNeonBranch', () => {
  it('sends DELETE request to correct URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

    await deleteNeonBranch('proj-123', 'br-456')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://console.neon.tech/api/v2/projects/proj-123/branches/br-456',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('does not throw on 404 (already deleted)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(deleteNeonBranch('proj-123', 'br-456')).resolves.toBeUndefined()
  })

  it('throws on other error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'internal error' }),
    })

    await expect(deleteNeonBranch('proj-123', 'br-456')).rejects.toThrow(
      'Failed to delete Neon branch',
    )
  })

  it('throws when NEON_API_KEY is missing', async () => {
    delete process.env.NEON_API_KEY

    await expect(deleteNeonBranch('proj-123', 'br-456')).rejects.toThrow('NEON_API_KEY')
  })
})
