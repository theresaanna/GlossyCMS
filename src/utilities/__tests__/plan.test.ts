import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

describe('plan utilities', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.SITE_PLAN
    delete process.env.IS_PRIMARY_INSTANCE
  })

  afterAll(() => {
    process.env = originalEnv
  })

  async function loadModule() {
    return import('../plan')
  }

  describe('getSitePlan', () => {
    it('returns "basic" when SITE_PLAN is not set', async () => {
      const { getSitePlan } = await loadModule()
      expect(getSitePlan()).toBe('basic')
    })

    it('returns "basic" when SITE_PLAN is an unknown value', async () => {
      process.env.SITE_PLAN = 'unknown'
      const { getSitePlan } = await loadModule()
      expect(getSitePlan()).toBe('basic')
    })

    it('returns "pro" when SITE_PLAN is "pro"', async () => {
      process.env.SITE_PLAN = 'pro'
      const { getSitePlan } = await loadModule()
      expect(getSitePlan()).toBe('pro')
    })
  })

  describe('isPrimaryInstance', () => {
    it('returns false when IS_PRIMARY_INSTANCE is not set', async () => {
      const { isPrimaryInstance } = await loadModule()
      expect(isPrimaryInstance()).toBe(false)
    })

    it('returns false when IS_PRIMARY_INSTANCE is "false"', async () => {
      process.env.IS_PRIMARY_INSTANCE = 'false'
      const { isPrimaryInstance } = await loadModule()
      expect(isPrimaryInstance()).toBe(false)
    })

    it('returns true when IS_PRIMARY_INSTANCE is "true"', async () => {
      process.env.IS_PRIMARY_INSTANCE = 'true'
      const { isPrimaryInstance } = await loadModule()
      expect(isPrimaryInstance()).toBe(true)
    })
  })

  describe('canUploadMediaType', () => {
    it('allows image uploads on basic plan', async () => {
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('image/jpeg')).toBe(true)
      expect(canUploadMediaType('image/png')).toBe(true)
      expect(canUploadMediaType('image/webp')).toBe(true)
    })

    it('blocks video uploads on basic plan', async () => {
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('video/mp4')).toBe(false)
      expect(canUploadMediaType('video/webm')).toBe(false)
    })

    it('blocks audio uploads on basic plan', async () => {
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('audio/mpeg')).toBe(false)
      expect(canUploadMediaType('audio/wav')).toBe(false)
    })

    it('allows all media types on pro plan', async () => {
      process.env.SITE_PLAN = 'pro'
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('image/jpeg')).toBe(true)
      expect(canUploadMediaType('video/mp4')).toBe(true)
      expect(canUploadMediaType('audio/mpeg')).toBe(true)
    })

    it('allows video uploads when IS_PRIMARY_INSTANCE is true (basic plan)', async () => {
      process.env.IS_PRIMARY_INSTANCE = 'true'
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('video/mp4')).toBe(true)
      expect(canUploadMediaType('video/webm')).toBe(true)
    })

    it('allows audio uploads when IS_PRIMARY_INSTANCE is true (basic plan)', async () => {
      process.env.IS_PRIMARY_INSTANCE = 'true'
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('audio/mpeg')).toBe(true)
      expect(canUploadMediaType('audio/wav')).toBe(true)
    })

    it('allows image uploads when IS_PRIMARY_INSTANCE is true', async () => {
      process.env.IS_PRIMARY_INSTANCE = 'true'
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('image/jpeg')).toBe(true)
    })

    it('blocks unknown MIME types on basic plan without IS_PRIMARY_INSTANCE', async () => {
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('application/pdf')).toBe(false)
    })

    it('allows unknown MIME types when IS_PRIMARY_INSTANCE is true', async () => {
      process.env.IS_PRIMARY_INSTANCE = 'true'
      const { canUploadMediaType } = await loadModule()
      expect(canUploadMediaType('application/pdf')).toBe(true)
    })
  })
})
