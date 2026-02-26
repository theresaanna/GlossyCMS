import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateSubdomain } from '../validateSubdomain'

function makeReq(findResult: { totalDocs: number; docs: any[] } = { totalDocs: 0, docs: [] }) {
  return {
    payload: {
      find: vi.fn().mockResolvedValue(findResult),
    },
  }
}

describe('validateSubdomain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns data unchanged when subdomain is not provided', async () => {
    const data = { name: 'test' }
    const result = await validateSubdomain({
      data,
      operation: 'create',
      originalDoc: undefined,
      req: makeReq(),
    } as any)

    expect(result).toBe(data)
  })

  it('normalizes subdomain to lowercase and trimmed', async () => {
    const data = { subdomain: '  MySubdomain  ' }
    const result = await validateSubdomain({
      data,
      operation: 'create',
      originalDoc: undefined,
      req: makeReq(),
    } as any)

    expect(result!.subdomain).toBe('mysubdomain')
  })

  it('skips validation on update when subdomain has not changed', async () => {
    const data = { subdomain: 'existing' }
    const req = makeReq()

    const result = await validateSubdomain({
      data,
      operation: 'update',
      originalDoc: { subdomain: 'existing' },
      req,
    } as any)

    expect(result!.subdomain).toBe('existing')
    // Should not call payload.find for uniqueness check
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('throws when subdomain is too short', async () => {
    const data = { subdomain: 'ab' }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any),
    ).rejects.toThrow('Subdomain must be between 3 and 63 characters.')
  })

  it('throws when subdomain is too long', async () => {
    const data = { subdomain: 'a'.repeat(64) }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any),
    ).rejects.toThrow('Subdomain must be between 3 and 63 characters.')
  })

  it('throws when subdomain contains invalid characters', async () => {
    const data = { subdomain: 'my_subdomain!' }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any),
    ).rejects.toThrow('Subdomain can only contain lowercase letters, numbers, and hyphens')
  })

  it('throws when subdomain starts with a hyphen', async () => {
    const data = { subdomain: '-invalid' }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any),
    ).rejects.toThrow('Subdomain can only contain lowercase letters, numbers, and hyphens')
  })

  it('throws when subdomain ends with a hyphen', async () => {
    const data = { subdomain: 'invalid-' }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any),
    ).rejects.toThrow('Subdomain can only contain lowercase letters, numbers, and hyphens')
  })

  it('throws when subdomain is reserved', async () => {
    const data = { subdomain: 'admin' }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any),
    ).rejects.toThrow('The subdomain "admin" is reserved')
  })

  it('throws for other reserved words', async () => {
    for (const word of ['www', 'api', 'staging', 'billing', 'cdn']) {
      const data = { subdomain: word }

      await expect(
        validateSubdomain({
          data,
          operation: 'create',
          originalDoc: undefined,
          req: makeReq(),
        } as any),
      ).rejects.toThrow(`The subdomain "${word}" is reserved`)
    }
  })

  it('throws when subdomain is already taken', async () => {
    const data = { subdomain: 'taken-name' }

    await expect(
      validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq({ totalDocs: 1, docs: [{ id: 'other-id', subdomain: 'taken-name' }] }),
      } as any),
    ).rejects.toThrow('The subdomain "taken-name" is already taken.')
  })

  it('allows updating when the existing doc is the same one', async () => {
    const data = { subdomain: 'mysite' }

    const result = await validateSubdomain({
      data,
      operation: 'update',
      originalDoc: { id: 'site-1', subdomain: 'old-name' },
      req: makeReq({ totalDocs: 1, docs: [{ id: 'site-1', subdomain: 'mysite' }] }),
    } as any)

    expect(result!.subdomain).toBe('mysite')
  })

  it('accepts valid subdomains', async () => {
    const validNames = ['my-site', 'cool123', 'abc', 'a1b2c3']

    for (const name of validNames) {
      const data = { subdomain: name }

      const result = await validateSubdomain({
        data,
        operation: 'create',
        originalDoc: undefined,
        req: makeReq(),
      } as any)

      expect(result!.subdomain).toBe(name)
    }
  })

  it('queries the database for uniqueness check', async () => {
    const req = makeReq()
    const data = { subdomain: 'mysite' }

    await validateSubdomain({
      data,
      operation: 'create',
      originalDoc: undefined,
      req,
    } as any)

    expect(req.payload.find).toHaveBeenCalledWith({
      collection: 'provisioned-sites',
      overrideAccess: true,
      where: { subdomain: { equals: 'mysite' } },
      limit: 1,
    })
  })
})
