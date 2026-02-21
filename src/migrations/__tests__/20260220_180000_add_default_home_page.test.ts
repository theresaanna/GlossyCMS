import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260220_180000_add_default_home_page'

describe('Migration: 20260220_180000_add_default_home_page', () => {
  describe('up', () => {
    it('creates a home page with content and social media blocks when none exists', async () => {
      const mockDb = {
        execute: vi
          .fn()
          .mockResolvedValueOnce({ rows: [] }) // SELECT: no existing home page
          .mockResolvedValueOnce({ rows: [{ id: 42 }] }) // INSERT pages RETURNING id
          .mockResolvedValueOnce({ rows: [{ id: 'content-1' }] }) // INSERT content block
          .mockResolvedValueOnce({ rows: [] }) // INSERT content column
          .mockResolvedValueOnce({ rows: [{ id: 'sm-1' }] }) // INSERT social media block
          .mockResolvedValueOnce({ rows: [] }), // INSERT social media platform
      }
      await up({ db: mockDb as any, payload: {} as any, req: {} as any })

      expect(mockDb.execute).toHaveBeenCalledTimes(6)
    })

    it('skips creation when a home page already exists', async () => {
      const mockDb = {
        execute: vi
          .fn()
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }), // SELECT: home page exists
      }
      await up({ db: mockDb as any, payload: {} as any, req: {} as any })

      expect(mockDb.execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('down', () => {
    it('deletes the home page and its blocks', async () => {
      const mockDb = {
        execute: vi
          .fn()
          .mockResolvedValue({ rows: [] }),
      }
      await down({ db: mockDb as any, payload: {} as any, req: {} as any })

      // content columns, content blocks, SM platforms, SM blocks, page
      expect(mockDb.execute).toHaveBeenCalledTimes(5)
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
