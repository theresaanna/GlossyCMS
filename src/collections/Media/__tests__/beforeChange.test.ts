import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import type { CollectionBeforeChangeHook } from 'payload'

const originalEnv = process.env

let validateMimeTypeHook: CollectionBeforeChangeHook
let setMetadataHook: CollectionBeforeChangeHook

beforeAll(async () => {
  const { Media } = await import('../index')
  const hooks = Media.hooks!.beforeChange! as CollectionBeforeChangeHook[]
  validateMimeTypeHook = hooks[0]
  setMetadataHook = hooks[1]
})

function makeArgs(
  overrides: {
    operation?: 'create' | 'update'
    mimetype?: string
    dataMimeType?: string
    fileName?: string
    fileSize?: number
    originalSize?: number
  } = {},
) {
  const {
    operation = 'create',
    mimetype,
    dataMimeType,
    fileName = 'test.mp4',
    fileSize = 1024 * 1024,
    originalSize,
  } = overrides

  return {
    operation,
    data: {
      ...(dataMimeType ? { mimeType: dataMimeType } : {}),
      ...(originalSize !== undefined ? { originalSize } : {}),
    },
    req: {
      file: mimetype
        ? { mimetype, name: fileName, size: fileSize }
        : undefined,
    },
  } as any
}

describe('Media beforeChange – MIME type validation hook', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.SITE_PLAN
    delete process.env.IS_PRIMARY_INSTANCE
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('allows image uploads on basic plan', async () => {
    const args = makeArgs({ mimetype: 'image/jpeg' })
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })

  it('blocks video uploads on basic plan', async () => {
    const args = makeArgs({ mimetype: 'video/mp4' })
    await expect(validateMimeTypeHook(args)).rejects.toThrow(
      'Audio and video uploads require the Pro plan',
    )
  })

  it('blocks audio uploads on basic plan', async () => {
    const args = makeArgs({ mimetype: 'audio/mpeg' })
    await expect(validateMimeTypeHook(args)).rejects.toThrow(
      'Audio and video uploads require the Pro plan',
    )
  })

  it('allows video uploads on pro plan', async () => {
    process.env.SITE_PLAN = 'pro'
    const args = makeArgs({ mimetype: 'video/mp4' })
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })

  it('allows audio uploads on pro plan', async () => {
    process.env.SITE_PLAN = 'pro'
    const args = makeArgs({ mimetype: 'audio/mpeg' })
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })

  it('allows video uploads when IS_PRIMARY_INSTANCE is true', async () => {
    process.env.IS_PRIMARY_INSTANCE = 'true'
    const args = makeArgs({ mimetype: 'video/mp4' })
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })

  it('allows audio uploads when IS_PRIMARY_INSTANCE is true', async () => {
    process.env.IS_PRIMARY_INSTANCE = 'true'
    const args = makeArgs({ mimetype: 'audio/mpeg' })
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })

  it('skips validation on update operations', async () => {
    const args = makeArgs({ operation: 'update', mimetype: 'video/mp4' })
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })

  it('reads mimeType from data when req.file is absent', async () => {
    const args = makeArgs({ dataMimeType: 'video/mp4' })
    // Remove the file from req so it falls back to data.mimeType
    args.req.file = undefined
    await expect(validateMimeTypeHook(args)).rejects.toThrow(
      'Audio and video uploads require the Pro plan',
    )
  })

  it('passes through when no mimeType is available', async () => {
    const args = makeArgs()
    args.req.file = undefined
    args.data = {}
    const result = await validateMimeTypeHook(args)
    expect(result).toEqual(args.data)
  })
})

describe('Media beforeChange – metadata hook', () => {
  it('sets originalSize for video uploads when not already set', async () => {
    const args = makeArgs({ mimetype: 'video/mp4', fileSize: 5_000_000 })
    const result = await setMetadataHook(args)
    expect(result.originalSize).toBe(5_000_000)
  })

  it('preserves existing originalSize for video uploads', async () => {
    const args = makeArgs({ mimetype: 'video/mp4', fileSize: 5_000_000, originalSize: 10_000_000 })
    const result = await setMetadataHook(args)
    expect(result.originalSize).toBe(10_000_000)
  })

  it('sets originalSize for audio uploads when not already set', async () => {
    const args = makeArgs({ mimetype: 'audio/mpeg', fileSize: 2_000_000 })
    const result = await setMetadataHook(args)
    expect(result.originalSize).toBe(2_000_000)
  })

  it('preserves existing originalSize for audio uploads', async () => {
    const args = makeArgs({ mimetype: 'audio/mpeg', fileSize: 2_000_000, originalSize: 4_000_000 })
    const result = await setMetadataHook(args)
    expect(result.originalSize).toBe(4_000_000)
  })

  it('does not set originalSize for image uploads', async () => {
    const args = makeArgs({ mimetype: 'image/jpeg', fileSize: 500_000 })
    const result = await setMetadataHook(args)
    expect(result.originalSize).toBeUndefined()
  })

  it('does not set originalSize on update operations', async () => {
    const args = makeArgs({ operation: 'update', mimetype: 'video/mp4', fileSize: 5_000_000 })
    const result = await setMetadataHook(args)
    expect(result.originalSize).toBeUndefined()
  })
})
