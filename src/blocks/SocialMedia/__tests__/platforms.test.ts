import { describe, it, expect } from 'vitest'
import { socialPlatforms } from '../platforms'

describe('socialPlatforms config', () => {
  it('contains all expected platforms', () => {
    const values = socialPlatforms.map((p) => p.value)
    expect(values).toContain('x')
    expect(values).toContain('instagram')
    expect(values).toContain('facebook')
    expect(values).toContain('loyalfans')
    expect(values).toContain('throne')
    expect(values).toContain('youpay')
  })

  it('has unique values for each platform', () => {
    const values = socialPlatforms.map((p) => p.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('has a urlPrefix for every platform', () => {
    for (const platform of socialPlatforms) {
      expect(platform.urlPrefix).toBeTruthy()
      expect(platform.urlPrefix).toMatch(/^https?:\/\//)
    }
  })

  it('has an SVG icon path for every platform', () => {
    for (const platform of socialPlatforms) {
      expect(platform.icon).toBeTruthy()
      expect(typeof platform.icon).toBe('string')
    }
  })

  it('has a label and usernameLabel for every platform', () => {
    for (const platform of socialPlatforms) {
      expect(platform.label).toBeTruthy()
      expect(platform.usernameLabel).toBeTruthy()
    }
  })

  it('does not include "other" as a platform value', () => {
    const values = socialPlatforms.map((p) => p.value)
    expect(values).not.toContain('other')
  })
})
