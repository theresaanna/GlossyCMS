import { describe, it, expect, vi } from 'vitest'
import { beforeSyncWithSearch } from '../beforeSync'

function makeArgs({
  relationTo = 'posts' as string,
  originalDoc = {} as Record<string, any>,
  searchDoc = {} as Record<string, any>,
  findByIDResult = null as any,
} = {}) {
  const findByID = vi.fn().mockResolvedValue(findByIDResult)

  return {
    args: {
      originalDoc: {
        id: 1,
        title: 'Test',
        slug: 'test',
        meta: { title: 'Meta Title', description: 'Meta desc', image: 'img-1' },
        ...originalDoc,
      },
      searchDoc: {
        doc: { relationTo },
        ...searchDoc,
      },
      req: { payload: { findByID } },
    } as any,
    findByID,
  }
}

describe('beforeSyncWithSearch', () => {
  describe('common fields', () => {
    it('syncs slug and meta for posts', async () => {
      const { args } = makeArgs({ relationTo: 'posts' })

      const result = await beforeSyncWithSearch(args)

      expect(result.slug).toBe('test')
      expect(result.meta).toEqual({
        title: 'Meta Title',
        description: 'Meta desc',
        image: 'img-1',
      })
    })

    it('syncs slug and meta for pages', async () => {
      const { args } = makeArgs({ relationTo: 'pages' })

      const result = await beforeSyncWithSearch(args)

      expect(result.slug).toBe('test')
      expect(result.meta).toEqual({
        title: 'Meta Title',
        description: 'Meta desc',
        image: 'img-1',
      })
    })

    it('falls back to doc title when meta.title is missing', async () => {
      const { args } = makeArgs({
        originalDoc: { meta: { description: 'desc' } },
      })

      const result = await beforeSyncWithSearch(args)

      expect(result.meta.title).toBe('Test')
    })

    it('extracts image id from populated image object', async () => {
      const { args } = makeArgs({
        originalDoc: { meta: { image: { id: 'img-42' } } },
      })

      const result = await beforeSyncWithSearch(args)

      expect(result.meta.image).toBe('img-42')
    })
  })

  describe('categories for posts', () => {
    it('populates categories by fetching from payload', async () => {
      const { args, findByID } = makeArgs({
        relationTo: 'posts',
        originalDoc: { categories: [10] },
        findByIDResult: { id: 10, title: 'Tech' },
      })

      const result = await beforeSyncWithSearch(args)

      expect(findByID).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'categories',
          id: 10,
        }),
      )
      expect(result.categories).toEqual([
        { relationTo: 'categories', categoryID: '10', title: 'Tech' },
      ])
    })

    it('uses already-populated category objects directly', async () => {
      const { args, findByID } = makeArgs({
        relationTo: 'posts',
        originalDoc: { categories: [{ id: 5, title: 'Art' }] },
      })

      const result = await beforeSyncWithSearch(args)

      expect(findByID).not.toHaveBeenCalled()
      expect(result.categories).toEqual([
        { relationTo: 'categories', categoryID: '5', title: 'Art' },
      ])
    })

    it('skips null/falsy categories', async () => {
      const { args, findByID } = makeArgs({
        relationTo: 'posts',
        originalDoc: { categories: [null, undefined, 0] },
      })

      const result = await beforeSyncWithSearch(args)

      expect(findByID).not.toHaveBeenCalled()
      expect(result.categories).toEqual([])
    })

    it('logs error when category is not found', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { args } = makeArgs({
        relationTo: 'posts',
        originalDoc: { categories: [99] },
        findByIDResult: null,
      })

      const result = await beforeSyncWithSearch(args)

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Category not found'),
      )
      expect(result.categories).toEqual([])
      spy.mockRestore()
    })
  })

  describe('pages skip categories', () => {
    it('does not fetch categories for pages', async () => {
      const { args, findByID } = makeArgs({
        relationTo: 'pages',
        originalDoc: { categories: [10] },
      })

      const result = await beforeSyncWithSearch(args)

      expect(findByID).not.toHaveBeenCalled()
      expect(result.categories).toEqual([])
    })

    it('returns empty categories even when page has no categories field', async () => {
      const { args } = makeArgs({ relationTo: 'pages' })

      const result = await beforeSyncWithSearch(args)

      expect(result.categories).toEqual([])
    })
  })
})
