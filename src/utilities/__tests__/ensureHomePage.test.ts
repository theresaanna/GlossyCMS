import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureHomePage } from '../ensureHomePage'

function createMockPayload({
  existingDocs = [],
}: { existingDocs?: Array<{ slug: string }> } = {}) {
  return {
    find: vi.fn().mockResolvedValue({ docs: existingDocs }),
    create: vi.fn().mockResolvedValue({ id: 1 }),
    logger: { info: vi.fn() },
  } as any
}

describe('ensureHomePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a home page when none exists', async () => {
    const payload = createMockPayload()

    await ensureHomePage(payload)

    expect(payload.find).toHaveBeenCalledWith({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'pages',
        depth: 0,
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: expect.objectContaining({
          title: 'Home',
          slug: 'home',
          _status: 'published',
          hero: { type: 'none' },
        }),
      }),
    )
    expect(payload.logger.info).toHaveBeenCalledWith('Created default home page.')
  })

  it('does not create a home page when one already exists', async () => {
    const payload = createMockPayload({
      existingDocs: [{ slug: 'home' }],
    })

    await ensureHomePage(payload)

    expect(payload.find).toHaveBeenCalledTimes(1)
    expect(payload.create).not.toHaveBeenCalled()
    expect(payload.logger.info).not.toHaveBeenCalled()
  })

  it('uses overrideAccess so it works without an authenticated user', async () => {
    const payload = createMockPayload()

    await ensureHomePage(payload)

    expect(payload.find.mock.calls[0][0].overrideAccess).toBe(true)
    expect(payload.create.mock.calls[0][0].overrideAccess).toBe(true)
  })

  it('creates a page with published status and content layout', async () => {
    const payload = createMockPayload()

    await ensureHomePage(payload)

    const createCall = payload.create.mock.calls[0][0]
    expect(createCall.data._status).toBe('published')
    expect(createCall.data.layout).toHaveLength(1)
    expect(createCall.data.layout[0].blockType).toBe('content')
    expect(createCall.data.meta).toEqual({
      title: 'Home',
      description: 'Welcome to our website.',
    })
  })
})
