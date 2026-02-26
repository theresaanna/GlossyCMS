import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../canUseDOM', () => ({ default: false }))

import { getServerSideURL, getClientSideURL } from '../getURL'

beforeEach(() => {
  vi.unstubAllEnvs()
})

describe('getServerSideURL', () => {
  it('returns NEXT_PUBLIC_SERVER_URL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://mysite.com')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'mysite.vercel.app')

    expect(getServerSideURL()).toBe('https://mysite.com')
  })

  it('falls back to VERCEL_PROJECT_PRODUCTION_URL with https prefix', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'mysite.vercel.app')

    expect(getServerSideURL()).toBe('https://mysite.vercel.app')
  })

  it('falls back to localhost:3000 when no env vars are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')

    expect(getServerSideURL()).toBe('http://localhost:3000')
  })
})

describe('getClientSideURL', () => {
  // canUseDOM is mocked to false, so we test the server-side fallbacks

  it('returns VERCEL_PROJECT_PRODUCTION_URL with https when canUseDOM is false', () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'mysite.vercel.app')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')

    expect(getClientSideURL()).toBe('https://mysite.vercel.app')
  })

  it('falls back to NEXT_PUBLIC_SERVER_URL when VERCEL_PROJECT_PRODUCTION_URL is not set', () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://mysite.com')

    expect(getClientSideURL()).toBe('https://mysite.com')
  })

  it('returns empty string when no env vars are set and canUseDOM is false', () => {
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', '')

    expect(getClientSideURL()).toBe('')
  })
})
