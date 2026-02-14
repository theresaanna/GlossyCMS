import { describe, it, expect } from 'vitest'
import { SocialMedia } from '../config'
import { socialPlatforms } from '../platforms'

describe('SocialMedia block config', () => {
  it('has the correct slug', () => {
    expect(SocialMedia.slug).toBe('socialMedia')
  })

  it('has the correct interfaceName', () => {
    expect(SocialMedia.interfaceName).toBe('SocialMediaBlock')
  })

  it('has a platforms array field', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    expect(platformsField).toBeDefined()
    expect(platformsField.type).toBe('array')
  })

  it('has a platform select field with all configured platforms plus "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const platformSelect = platformsField.fields.find(
      (f: any) => f.name === 'platform',
    )
    expect(platformSelect).toBeDefined()
    expect(platformSelect.type).toBe('select')
    expect(platformSelect.required).toBe(true)

    const optionValues = platformSelect.options.map((o: any) => o.value)
    for (const p of socialPlatforms) {
      expect(optionValues).toContain(p.value)
    }
    expect(optionValues).toContain('other')
  })

  it('has a username text field', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const usernameField = platformsField.fields.find(
      (f: any) => f.name === 'username',
    )
    expect(usernameField).toBeDefined()
    expect(usernameField.type).toBe('text')
  })

  it('hides username field when platform is "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const usernameField = platformsField.fields.find(
      (f: any) => f.name === 'username',
    )
    const condition = usernameField.admin.condition
    expect(condition({}, { platform: 'other' })).toBe(false)
    expect(condition({}, { platform: 'x' })).toBe(true)
    expect(condition({}, { platform: undefined })).toBe(false)
  })

  it('has customLabel and customUrl fields for "other" platform', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const customLabel = platformsField.fields.find(
      (f: any) => f.name === 'customLabel',
    )
    const customUrl = platformsField.fields.find(
      (f: any) => f.name === 'customUrl',
    )
    expect(customLabel).toBeDefined()
    expect(customUrl).toBeDefined()
    expect(customLabel.type).toBe('text')
    expect(customUrl.type).toBe('text')
  })

  it('shows customLabel only when platform is "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const customLabel = platformsField.fields.find(
      (f: any) => f.name === 'customLabel',
    )
    const condition = customLabel.admin.condition
    expect(condition({}, { platform: 'other' })).toBe(true)
    expect(condition({}, { platform: 'x' })).toBe(false)
  })

  it('shows customUrl only when platform is "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const customUrl = platformsField.fields.find(
      (f: any) => f.name === 'customUrl',
    )
    const condition = customUrl.admin.condition
    expect(condition({}, { platform: 'other' })).toBe(true)
    expect(condition({}, { platform: 'instagram' })).toBe(false)
  })
})
