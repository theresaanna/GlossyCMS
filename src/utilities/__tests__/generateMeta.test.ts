import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

vi.mock('@/utilities/getURL', () => ({
  getServerSideURL: () => 'http://localhost:3000',
}))

const mockGetSiteMetaDefaults = vi.fn()

vi.mock('@/utilities/getSiteMetaDefaults', () => ({
  getSiteMetaDefaults: (...args: any[]) => mockGetSiteMetaDefaults(...args),
}))

describe('generateMeta', () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetSiteMetaDefaults.mockResolvedValue({
      siteName: 'Glossy',
      siteDescription: 'A website powered by Glossy.',
      ogImageUrl: 'http://localhost:3000/website-template-OG.webp',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses default site name from getSiteMetaDefaults', async () => {
    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({ doc: null })

    expect(result.title).toBe('Glossy')
  })

  it('uses custom site name from getSiteMetaDefaults', async () => {
    mockGetSiteMetaDefaults.mockResolvedValue({
      siteName: 'My Custom Site',
      siteDescription: 'Custom description',
      ogImageUrl: 'http://localhost:3000/custom-og.png',
    })

    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({ doc: null })

    expect(result.title).toBe('My Custom Site')
  })

  it('appends site name to doc meta title', async () => {
    mockGetSiteMetaDefaults.mockResolvedValue({
      siteName: 'My Site',
      siteDescription: 'A website powered by Glossy.',
      ogImageUrl: 'http://localhost:3000/website-template-OG.webp',
    })

    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({
      doc: { meta: { title: 'About Us' } } as any,
    })

    expect(result.title).toBe('About Us | My Site')
  })

  it('appends default site name to doc meta title', async () => {
    const { generateMeta } = await import('../generateMeta')
    const result = await generateMeta({
      doc: { meta: { title: 'About Us' } } as any,
    })

    expect(result.title).toBe('About Us | Glossy')
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
