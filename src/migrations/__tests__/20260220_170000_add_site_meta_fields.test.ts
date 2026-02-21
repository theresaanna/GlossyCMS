import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260220_170000_add_site_meta_fields'

describe('Migration: 20260220_170000_add_site_meta_fields', () => {
  const createMockDb = () => {
    const executedStatements: string[] = []
    return {
      execute: vi.fn((sqlTemplate: { toString: () => string }) => {
        executedStatements.push(sqlTemplate.toString())
        return Promise.resolve()
      }),
      executedStatements,
    }
  }

  describe('up', () => {
    it('executes SQL without throwing', async () => {
      const mockDb = createMockDb()
      await expect(
        up({ db: mockDb, payload: {} as any, req: {} as any }),
      ).resolves.not.toThrow()
    })

    it('calls db.execute once', async () => {
      const mockDb = createMockDb()
      await up({ db: mockDb, payload: {} as any, req: {} as any })
      expect(mockDb.execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('down', () => {
    it('executes SQL without throwing', async () => {
      const mockDb = createMockDb()
      await expect(
        down({ db: mockDb, payload: {} as any, req: {} as any }),
      ).resolves.not.toThrow()
    })

    it('calls db.execute once', async () => {
      const mockDb = createMockDb()
      await down({ db: mockDb, payload: {} as any, req: {} as any })
      expect(mockDb.execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('migration is registered in index', () => {
    it('is included in the migrations array', async () => {
      const { migrations } = await import('../index')
      const migration = migrations.find(
        (m) => m.name === '20260220_170000_add_site_meta_fields',
      )
      expect(migration).toBeDefined()
      expect(migration!.up).toBeDefined()
      expect(migration!.down).toBeDefined()
    })

    it('is positioned after add_media_block_size', async () => {
      const { migrations } = await import('../index')
      const thisIndex = migrations.findIndex(
        (m) => m.name === '20260220_170000_add_site_meta_fields',
      )
      const prevIndex = migrations.findIndex(
        (m) => m.name === '20260220_160000_add_media_block_size',
      )
      expect(thisIndex).toBeGreaterThan(prevIndex)
    })
  })
})
