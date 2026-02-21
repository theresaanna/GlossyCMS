import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260220_180000_add_default_home_page'

describe('Migration: 20260220_180000_add_default_home_page', () => {
  describe('up', () => {
    it('creates a home page with content and social media blocks when none exists', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValueOnce({ docs: [] }),
        create: vi.fn().mockResolvedValueOnce({ id: 42 }),
      }
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.find).toHaveBeenCalledTimes(1)
      expect(mockPayload.create).toHaveBeenCalledTimes(1)
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          data: expect.objectContaining({
            title: 'Home',
            slug: 'home',
            _status: 'published',
            layout: expect.arrayContaining([
              expect.objectContaining({ blockType: 'content' }),
              expect.objectContaining({ blockType: 'socialMedia' }),
            ]),
          }),
        }),
      )
    })

    it('skips creation when a home page already exists', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValueOnce({ docs: [{ id: 1 }] }),
        create: vi.fn(),
      }
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.find).toHaveBeenCalledTimes(1)
      expect(mockPayload.create).not.toHaveBeenCalled()
    })
  })

  describe('down', () => {
    it('deletes the home page', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValueOnce({ docs: [{ id: 42 }] }),
        delete: vi.fn().mockResolvedValueOnce({}),
      }
      await down({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.delete).toHaveBeenCalledWith(
        expect.objectContaining({ collection: 'pages', id: 42 }),
      )
    })

    it('does nothing when no home page exists', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValueOnce({ docs: [] }),
        delete: vi.fn(),
      }
      await down({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.delete).not.toHaveBeenCalled()
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
