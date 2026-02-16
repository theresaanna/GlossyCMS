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

  it('username validates as required only when platform is not "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const usernameField = platformsField.fields.find(
      (f: any) => f.name === 'username',
    )
    const validate = usernameField.validate
    expect(validate('', { siblingData: { platform: 'x' } })).toBe('This field is required.')
    expect(validate(null, { siblingData: { platform: 'instagram' } })).toBe('This field is required.')
    expect(validate('myuser', { siblingData: { platform: 'x' } })).toBe(true)
    expect(validate('', { siblingData: { platform: 'other' } })).toBe(true)
    expect(validate('', { siblingData: {} })).toBe(true)
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

  it('customLabel validates as required only when platform is "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const customLabel = platformsField.fields.find(
      (f: any) => f.name === 'customLabel',
    )
    const validate = customLabel.validate
    expect(validate('', { siblingData: { platform: 'other' } })).toBe('This field is required.')
    expect(validate(null, { siblingData: { platform: 'other' } })).toBe('This field is required.')
    expect(validate('My Link', { siblingData: { platform: 'other' } })).toBe(true)
    expect(validate('', { siblingData: { platform: 'x' } })).toBe(true)
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

  it('customUrl validates as required only when platform is "other"', () => {
    const platformsField = SocialMedia.fields.find(
      (f) => 'name' in f && f.name === 'platforms',
    ) as any
    const customUrl = platformsField.fields.find(
      (f: any) => f.name === 'customUrl',
    )
    const validate = customUrl.validate
    expect(validate('', { siblingData: { platform: 'other' } })).toBe('This field is required.')
    expect(validate(null, { siblingData: { platform: 'other' } })).toBe('This field is required.')
    expect(validate('https://example.com', { siblingData: { platform: 'other' } })).toBe(true)
    expect(validate('', { siblingData: { platform: 'instagram' } })).toBe(true)
  })

  describe('header field', () => {
    it('has an optional header text field', () => {
      const headerField = SocialMedia.fields.find(
        (f) => 'name' in f && f.name === 'header',
      ) as any
      expect(headerField).toBeDefined()
      expect(headerField.type).toBe('text')
    })

    it('header field is not required', () => {
      const headerField = SocialMedia.fields.find(
        (f) => 'name' in f && f.name === 'header',
      ) as any
      expect(headerField.required).toBeUndefined()
    })

    it('header field has a description', () => {
      const headerField = SocialMedia.fields.find(
        (f) => 'name' in f && f.name === 'header',
      ) as any
      expect(headerField.admin.description).toBeTruthy()
    })
  })

  it('orders fields as header, customPlatforms, platforms', () => {
    const fieldNames = SocialMedia.fields
      .filter((f) => 'name' in f)
      .map((f) => ('name' in f ? f.name : ''))
    expect(fieldNames).toEqual(['header', 'customPlatforms', 'platforms'])
  })

  describe('customPlatforms field', () => {
    it('has a customPlatforms array field', () => {
      const customPlatformsField = SocialMedia.fields.find(
        (f) => 'name' in f && f.name === 'customPlatforms',
      ) as any
      expect(customPlatformsField).toBeDefined()
      expect(customPlatformsField.type).toBe('array')
    })

    it('customPlatforms has label and url fields', () => {
      const customPlatformsField = SocialMedia.fields.find(
        (f) => 'name' in f && f.name === 'customPlatforms',
      ) as any
      const labelField = customPlatformsField.fields.find(
        (f: any) => f.name === 'label',
      )
      const urlField = customPlatformsField.fields.find(
        (f: any) => f.name === 'url',
      )
      expect(labelField).toBeDefined()
      expect(labelField.type).toBe('text')
      expect(labelField.required).toBe(true)
      expect(urlField).toBeDefined()
      expect(urlField.type).toBe('text')
      expect(urlField.required).toBe(true)
    })

    it('customPlatforms starts collapsed', () => {
      const customPlatformsField = SocialMedia.fields.find(
        (f) => 'name' in f && f.name === 'customPlatforms',
      ) as any
      expect(customPlatformsField.admin.initCollapsed).toBe(true)
    })
  })
})
