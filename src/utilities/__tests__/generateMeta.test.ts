import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

vi.mock('@/utilities/getURL', () => ({
  getServerSideURL: () => 'http://localhost:3000',
}))

describe('generateMeta', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses default site name when SITE_NAME is not set', async () => {
    delete process.env.SITE_NAME

    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({ doc: null })

    expect(result.title).toBe('GlossyCMS')
  })

  it('uses SITE_NAME env var when set', async () => {
    process.env.SITE_NAME = 'My Custom Site'

    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({ doc: null })

    expect(result.title).toBe('My Custom Site')
  })

  it('appends site name to doc meta title', async () => {
    process.env.SITE_NAME = 'My Site'

    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({
      doc: { meta: { title: 'About Us' } } as any,
    })

    expect(result.title).toBe('About Us | My Site')
  })

  it('appends default site name to doc meta title when env var not set', async () => {
    delete process.env.SITE_NAME

    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({
      doc: { meta: { title: 'About Us' } } as any,
    })

    expect(result.title).toBe('About Us | GlossyCMS')
  })

  it('includes doc meta description', async () => {
    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({
      doc: { meta: { description: 'A test page' } } as any,
    })

    expect(result.description).toBe('A test page')
  })

  it('includes openGraph data', async () => {
    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({
      doc: { slug: 'test-page' } as any,
    })

    expect(result.openGraph).toBeDefined()
  })
})
