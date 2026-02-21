import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260221_130000_seed_default_content'

describe('Migration: 20260221_130000_seed_default_content', () => {
  describe('up', () => {
    it('skips if About page already exists', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValueOnce({ docs: [{ id: 1 }] }),
        create: vi.fn(),
        updateGlobal: vi.fn(),
      }
      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.find).toHaveBeenCalledTimes(1)
      expect(mockPayload.create).not.toHaveBeenCalled()
      expect(mockPayload.updateGlobal).not.toHaveBeenCalled()
    })

    it('creates all seed content when About page does not exist', async () => {
      const mockPayload = {
        find: vi.fn().mockResolvedValueOnce({ docs: [] }),
        create: vi
          .fn()
          .mockResolvedValueOnce({ id: 10 }) // About page
          .mockResolvedValueOnce({ id: 20 }), // Welcome post
        updateGlobal: vi.fn().mockResolvedValue({}),
      }

      await up({ db: {} as any, payload: mockPayload as any, req: {} as any })

      // Creates About page and Welcome post
      expect(mockPayload.create).toHaveBeenCalledTimes(2)
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'pages',
          data: expect.objectContaining({ title: 'About', slug: 'about' }),
        }),
      )
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'posts',
          data: expect.objectContaining({ title: 'Welcome to Your New Site' }),
        }),
      )

      // Updates header and footer globals
      expect(mockPayload.updateGlobal).toHaveBeenCalledTimes(2)
      expect(mockPayload.updateGlobal).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'header' }),
      )
      expect(mockPayload.updateGlobal).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'footer' }),
      )
    })
  })

  describe('down', () => {
    it('cleans up all seed content', async () => {
      const mockPayload = {
        find: vi
          .fn()
          .mockResolvedValueOnce({ docs: [{ id: 20 }] }) // post
          .mockResolvedValueOnce({ docs: [{ id: 10 }] }), // about page
        delete: vi.fn().mockResolvedValue({}),
        updateGlobal: vi.fn().mockResolvedValue({}),
      }
      await down({ db: {} as any, payload: mockPayload as any, req: {} as any })

      expect(mockPayload.updateGlobal).toHaveBeenCalledTimes(2)
      expect(mockPayload.delete).toHaveBeenCalledTimes(2)
    })
  })

  describe('migration is registered in index', () => {
    it('is included in the migrations array', async () => {
      const { migrations } = await import('../index')
      const migration = migrations.find(
        (m) => m.name === '20260221_130000_seed_default_content',
      )
      expect(migration).toBeDefined()
      expect(migration!.up).toBeDefined()
      expect(migration!.down).toBeDefined()
    })

    it('runs after add_social_media_notes migration', async () => {
      const { migrations } = await import('../index')
      const notesIndex = migrations.findIndex(
        (m) => m.name === '20260221_120000_add_social_media_notes',
      )
      const seedIndex = migrations.findIndex(
        (m) => m.name === '20260221_130000_seed_default_content',
      )
      expect(seedIndex).toBeGreaterThan(notesIndex)
    })
  })
})
