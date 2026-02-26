import { describe, it, expect, vi, beforeEach } from 'vitest'
import { populateAuthors } from '../populateAuthors'

function makePayload(users: Record<string, any> = {}) {
  return {
    findByID: vi.fn().mockImplementation(({ id }: { id: string | number }) => {
      const user = users[String(id)]
      if (!user) return Promise.reject(new Error('Not found'))
      return Promise.resolve(user)
    }),
  }
}

describe('populateAuthors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('populates authors from numeric IDs', async () => {
    const payload = makePayload({
      '1': { id: 1, name: 'Alice', email: 'alice@test.com' },
      '2': { id: 2, name: 'Bob', email: 'bob@test.com' },
    })
    const doc = { authors: [1, 2] }

    const result = await populateAuthors({
      doc,
      req: { payload },
    } as any)

    expect(result.populatedAuthors).toEqual([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
  })

  it('populates authors from object references', async () => {
    const payload = makePayload({
      '1': { id: 1, name: 'Alice' },
    })
    const doc = { authors: [{ id: 1 }] }

    const result = await populateAuthors({
      doc,
      req: { payload },
    } as any)

    expect(result.populatedAuthors).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('calls findByID with correct parameters', async () => {
    const payload = makePayload({
      '5': { id: 5, name: 'Eve' },
    })
    const doc = { authors: [5] }

    await populateAuthors({
      doc,
      req: { payload },
    } as any)

    expect(payload.findByID).toHaveBeenCalledWith({
      id: 5,
      collection: 'users',
      depth: 0,
    })
  })

  it('returns doc unchanged when authors array is empty', async () => {
    const payload = makePayload()
    const doc = { authors: [] }

    const result = await populateAuthors({
      doc,
      req: { payload },
    } as any)

    expect(result).toBe(doc)
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('returns doc unchanged when authors is undefined', async () => {
    const payload = makePayload()
    const doc = { title: 'No authors' }

    const result = await populateAuthors({
      doc,
      req: { payload },
    } as any)

    expect(result).toBe(doc)
  })

  it('silently handles errors from findByID', async () => {
    const payload = makePayload({
      '1': { id: 1, name: 'Alice' },
      // '2' will throw
    })
    const doc = { authors: [1, 2] }

    const result = await populateAuthors({
      doc,
      req: { payload },
    } as any)

    // Only Alice should be populated; Bob's error is swallowed
    expect(result.populatedAuthors).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('only includes id and name in populated authors', async () => {
    const payload = makePayload({
      '1': { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin', secret: 'xyz' },
    })
    const doc = { authors: [1] }

    const result = await populateAuthors({
      doc,
      req: { payload },
    } as any)

    expect(result.populatedAuthors).toEqual([{ id: 1, name: 'Alice' }])
    expect(result.populatedAuthors[0]).not.toHaveProperty('email')
    expect(result.populatedAuthors[0]).not.toHaveProperty('role')
  })
})
