import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260221_130000_seed_default_content'

describe('Migration: 20260221_130000_seed_default_content', () => {
  describe('up', () => {
    it('skips if About page already exists', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValueOnce({ rows: [{ id: 1 }] }), // SELECT about page exists
      }
      await up({ db: mockDb as any, payload: {} as any, req: {} as any })

      expect(mockDb.execute).toHaveBeenCalledTimes(1)
    })

    it('creates all seed content when About page does not exist', async () => {
      const mockDb = {
        execute: vi
          .fn()
          // 1: SELECT about page — not found
          .mockResolvedValueOnce({ rows: [] })
          // 2: SELECT home page social media block
          .mockResolvedValueOnce({ rows: [{ id: 'sm-block-1' }] })
          // 3: INSERT social media platforms
          .mockResolvedValueOnce({ rows: [] })
          // 4: INSERT about page
          .mockResolvedValueOnce({ rows: [{ id: 10 }] })
          // 5: INSERT content block
          .mockResolvedValueOnce({ rows: [{ id: 'content-block-1' }] })
          // 6: INSERT content column
          .mockResolvedValueOnce({ rows: [] })
          // 7: INSERT welcome post
          .mockResolvedValueOnce({ rows: [{ id: 20 }] })
          // 8: UPSERT header
          .mockResolvedValueOnce({ rows: [] })
          // 9: DELETE header_rels
          .mockResolvedValueOnce({ rows: [] })
          // 10: DELETE header_nav_items
          .mockResolvedValueOnce({ rows: [] })
          // 11: INSERT header nav item (About)
          .mockResolvedValueOnce({ rows: [] })
          // 12: INSERT header nav item (Posts)
          .mockResolvedValueOnce({ rows: [] })
          // 13: INSERT header_rels (About ref)
          .mockResolvedValueOnce({ rows: [] })
          // 14: UPSERT footer
          .mockResolvedValueOnce({ rows: [] })
          // 15: DELETE footer_rels
          .mockResolvedValueOnce({ rows: [] })
          // 16: DELETE footer_nav_items
          .mockResolvedValueOnce({ rows: [] })
          // 17: INSERT footer nav item (About)
          .mockResolvedValueOnce({ rows: [] })
          // 18: INSERT footer nav item (Posts)
          .mockResolvedValueOnce({ rows: [] })
          // 19: INSERT footer_rels (About ref)
          .mockResolvedValueOnce({ rows: [] }),
      }

      await up({ db: mockDb as any, payload: {} as any, req: {} as any })

      expect(mockDb.execute).toHaveBeenCalledTimes(19)
    })

    it('handles missing home page social media block gracefully', async () => {
      const mockDb = {
        execute: vi
          .fn()
          // 1: SELECT about page — not found
          .mockResolvedValueOnce({ rows: [] })
          // 2: SELECT home page social media block — not found
          .mockResolvedValueOnce({ rows: [] })
          // Continues with About page, post, header, footer...
          .mockResolvedValue({ rows: [{ id: 99 }] }),
      }

      await expect(
        up({ db: mockDb as any, payload: {} as any, req: {} as any }),
      ).resolves.not.toThrow()
    })
  })

  describe('down', () => {
    it('cleans up all seed content', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      }
      await down({ db: mockDb as any, payload: {} as any, req: {} as any })

      // footer rels, footer nav items, footer newsletter update,
      // header rels, header nav items, delete post, delete about page,
      // delete social media platforms
      expect(mockDb.execute).toHaveBeenCalledTimes(8)
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
