import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generatePreviewPath } from '../generatePreviewPath'

beforeEach(() => {
  vi.unstubAllEnvs()
})

describe('generatePreviewPath', () => {
  it('generates a preview URL for posts', () => {
    vi.stubEnv('PREVIEW_SECRET', 'my-secret')

    const result = generatePreviewPath({
      collection: 'posts',
      slug: 'hello-world',
      req: {} as any,
    })

    expect(result).toContain('/next/preview?')
    expect(result).toContain('slug=hello-world')
    expect(result).toContain('collection=posts')
    expect(result).toContain('path=%2Fposts%2Fhello-world')
    expect(result).toContain('previewSecret=my-secret')
  })

  it('generates a preview URL for pages with empty prefix', () => {
    vi.stubEnv('PREVIEW_SECRET', 'secret123')

    const result = generatePreviewPath({
      collection: 'pages',
      slug: 'about',
      req: {} as any,
    })

    expect(result).toContain('collection=pages')
    expect(result).toContain('path=%2Fabout')
  })

  it('returns null when slug is undefined', () => {
    const result = generatePreviewPath({
      collection: 'posts',
      slug: undefined as any,
      req: {} as any,
    })

    expect(result).toBeNull()
  })

  it('returns null when slug is null', () => {
    const result = generatePreviewPath({
      collection: 'posts',
      slug: null as any,
      req: {} as any,
    })

    expect(result).toBeNull()
  })

  it('handles empty string slug (e.g. homepage)', () => {
    vi.stubEnv('PREVIEW_SECRET', 'secret')

    const result = generatePreviewPath({
      collection: 'pages',
      slug: '',
      req: {} as any,
    })

    expect(result).not.toBeNull()
    expect(result).toContain('slug=')
  })

  it('encodes special characters in slug', () => {
    vi.stubEnv('PREVIEW_SECRET', 'secret')

    const result = generatePreviewPath({
      collection: 'posts',
      slug: 'hello world & more',
      req: {} as any,
    })

    expect(result).toContain('slug=hello%2520world%2520%2526%2520more')
  })

  it('uses empty string when PREVIEW_SECRET is not set', () => {
    vi.stubEnv('PREVIEW_SECRET', '')

    const result = generatePreviewPath({
      collection: 'posts',
      slug: 'test',
      req: {} as any,
    })

    expect(result).toContain('previewSecret=')
  })
})
