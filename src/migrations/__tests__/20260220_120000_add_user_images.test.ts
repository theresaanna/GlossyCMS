import { describe, it, expect, vi } from 'vitest'
import { up, down } from '../20260220_120000_add_user_images'

describe('Migration: 20260220_120000_add_user_images', () => {
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

    it('calls db.execute', async () => {
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

    it('calls db.execute', async () => {
      const mockDb = createMockDb()
      await down({ db: mockDb, payload: {} as any, req: {} as any })
      expect(mockDb.execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('migration is registered in index', () => {
    it('is included in the migrations array', async () => {
      const { migrations } = await import('../index')
      const migration = migrations.find(
        (m) => m.name === '20260220_120000_add_user_images',
      )
      expect(migration).toBeDefined()
      expect(migration!.up).toBeDefined()
      expect(migration!.down).toBeDefined()
    })

    it('is the last migration in the list', async () => {
      const { migrations } = await import('../index')
      const lastMigration = migrations[migrations.length - 1]
      expect(lastMigration.name).toBe('20260220_120000_add_user_images')
    })
  })
})
