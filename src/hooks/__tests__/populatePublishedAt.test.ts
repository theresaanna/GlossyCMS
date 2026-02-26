import { describe, it, expect, vi, beforeEach } from 'vitest'
import { populatePublishedAt } from '../populatePublishedAt'

describe('populatePublishedAt', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('sets publishedAt on create when not provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))

    const data = { title: 'Test' }
    const result = populatePublishedAt({
      data,
      operation: 'create',
      req: { data: { title: 'Test' } },
    } as any)

    expect(result.publishedAt).toEqual(new Date('2026-06-15T12:00:00.000Z'))
  })

  it('sets publishedAt on update when not provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))

    const data = { title: 'Test' }
    const result = populatePublishedAt({
      data,
      operation: 'update',
      req: { data: { title: 'Test' } },
    } as any)

    expect(result.publishedAt).toEqual(new Date('2026-06-15T12:00:00.000Z'))
  })

  it('does not overwrite existing publishedAt', () => {
    const existingDate = '2025-01-01T00:00:00.000Z'
    const data = { title: 'Test', publishedAt: existingDate }

    const result = populatePublishedAt({
      data,
      operation: 'create',
      req: { data: { publishedAt: existingDate } },
    } as any)

    expect(result).toBe(data) // returns data unchanged
  })

  it('returns data unchanged for non-create/update operations', () => {
    const data = { title: 'Test' }

    const result = populatePublishedAt({
      data,
      operation: 'read' as any,
      req: { data: {} },
    } as any)

    expect(result).toBe(data)
  })
})
