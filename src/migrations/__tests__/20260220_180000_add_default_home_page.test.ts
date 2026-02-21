import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260220_180000_add_default_home_page'

describe('Migration: 20260220_180000_add_default_home_page', () => {
  const createMockPayload = (existingHomePage = false) => ({
    find: vi.fn().mockResolvedValue({
      docs: existingHomePage ? [{ id: 1, slug: 'home' }] : [],
    }),
    create: vi.fn().mockResolvedValue({ id: 1, slug: 'home' }),
    delete: vi.fn().mockResolvedValue({ docs: [] }),
  })

  describe('up', () => {
    it('creates a home page when none exists', async () => {
      const mockPayload = createMockPayload(false)
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.find).toHaveBeenCalledTimes(1)
      expect(mockPayload.find).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          where: { slug: { equals: 'home' } },
        }),
      )
      expect(mockPayload.create).toHaveBeenCalledTimes(1)
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          data: expect.objectContaining({
            title: 'Home',
            slug: 'home',
            _status: 'published',
          }),
        }),
      )
    })

    it('creates home page with a social media block in layout', async () => {
      const mockPayload = createMockPayload(false)
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      const createCall = mockPayload.create.mock.calls[0][0]
      const layout = createCall.data.layout
      expect(layout).toHaveLength(1)
      expect(layout[0].blockType).toBe('socialMedia')
      expect(layout[0].header).toBe('Follow Us')
      expect(layout[0].platforms).toEqual([])
    })

    it('skips creation when a home page already exists', async () => {
      const mockPayload = createMockPayload(true)
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.find).toHaveBeenCalledTimes(1)
      expect(mockPayload.create).not.toHaveBeenCalled()
    })

    it('disables revalidation during migration', async () => {
      const mockPayload = createMockPayload(false)
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      const createCall = mockPayload.create.mock.calls[0][0]
      expect(createCall.context).toEqual({ disableRevalidate: true })
    })
  })

  describe('down', () => {
    it('deletes the home page', async () => {
      const mockPayload = createMockPayload()
      await down({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.delete).toHaveBeenCalledTimes(1)
      expect(mockPayload.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          where: { slug: { equals: 'home' } },
          context: { disableRevalidate: true },
        }),
      )
    })
  })

  describe('migration is registered in index', () => {
    it('is included in the migrations array', async () => {
      const { migrations } = await import('../index')
      const migration = migrations.find(
        (m) => m.name === '20260220_180000_add_default_home_page',
      )
      expect(migration).toBeDefined()
      expect(migration!.up).toBeDefined()
      expect(migration!.down).toBeDefined()
    })

  })
})
