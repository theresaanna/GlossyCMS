import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('mergeOpenGraph', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('uses default site name when SITE_NAME is not set', async () => {
    delete process.env.SITE_NAME
    delete process.env.SITE_DESCRIPTION

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph()

    expect(result?.siteName).toBe('Glossy')
    expect(result?.title).toBe('Glossy')
  })

  it('uses SITE_NAME env var when set', async () => {
    process.env.SITE_NAME = 'My Custom Site'

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph()

    expect(result?.siteName).toBe('My Custom Site')
    expect(result?.title).toBe('My Custom Site')
  })

  it('uses default description when SITE_DESCRIPTION is not set', async () => {
    delete process.env.SITE_DESCRIPTION

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph()

    expect(result?.description).toBe('A website powered by Glossy.')
  })

  it('uses SITE_DESCRIPTION env var when set', async () => {
    process.env.SITE_DESCRIPTION = 'A custom site description.'

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph()

    expect(result?.description).toBe('A custom site description.')
  })

  it('merges custom openGraph data over defaults', async () => {
    delete process.env.SITE_NAME

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph({
      title: 'Custom Title',
      description: 'Custom description',
    })

    expect(result?.title).toBe('Custom Title')
    expect(result?.description).toBe('Custom description')
    // siteName should still come from default since it wasn't overridden
    expect(result?.siteName).toBe('Glossy')
  })

  it('uses custom images when provided', async () => {
    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const customImages = [{ url: 'https://example.com/og.png' }]

    const result = mergeOpenGraph({ images: customImages })

    expect(result?.images).toEqual(customImages)
  })

  it('uses no images when no defaults or custom images provided', async () => {
    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph()

    expect(result?.images).toBeUndefined()
  })

  it('uses defaults parameter when provided', async () => {
    delete process.env.SITE_NAME
    delete process.env.SITE_DESCRIPTION

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph(undefined, {
      siteName: 'My DB Site',
      siteDescription: 'From the database',
      ogImageUrl: 'http://localhost:3000/db-og.png',
    })

    expect(result?.siteName).toBe('My DB Site')
    expect(result?.title).toBe('My DB Site')
    expect(result?.description).toBe('From the database')
    expect(result?.images).toEqual([{ url: 'http://localhost:3000/db-og.png' }])
  })

  it('defaults parameter takes priority over env vars', async () => {
    process.env.SITE_NAME = 'Env Site'
    process.env.SITE_DESCRIPTION = 'Env description'

    const { mergeOpenGraph } = await import('../mergeOpenGraph')
    const result = mergeOpenGraph(undefined, {
      siteName: 'DB Site',
      siteDescription: 'DB description',
      ogImageUrl: 'http://localhost:3000/db-og.png',
    })

    expect(result?.siteName).toBe('DB Site')
    expect(result?.description).toBe('DB description')
  })
})
