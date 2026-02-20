import { describe, it, expect } from 'vitest'
import { SiteSettings } from '../config'

describe('SiteSettings global config', () => {
  it('has the correct slug', () => {
    expect(SiteSettings.slug).toBe('site-settings')
  })

  it('has the correct label', () => {
    expect(SiteSettings.label).toBe('Site Settings')
  })

  it('allows public read access', () => {
    const result = (SiteSettings.access!.read as Function)({})
    expect(result).toBe(true)
  })

  it('has a siteTitle text field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'siteTitle',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
  })

  it('has a description on the siteTitle field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'siteTitle',
    ) as any
    expect(field.admin.description).toBeDefined()
    expect(field.admin.description).toContain('title')
  })

  it('has a headerImage upload field related to media', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'headerImage',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('upload')
    expect(field.relationTo).toBe('media')
  })

  it('has a description on the headerImage field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'headerImage',
    ) as any
    expect(field.admin.description).toBeDefined()
    expect(field.admin.description).toContain('header')
  })

  it('has a userImage upload field related to media', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'userImage',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('upload')
    expect(field.relationTo).toBe('media')
  })

  it('has a description on the userImage field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'userImage',
    ) as any
    expect(field.admin.description).toBeDefined()
    expect(field.admin.description).toContain('profile picture')
  })

  it('has all expected fields', () => {
    const fieldNames = SiteSettings.fields
      .filter((f) => 'name' in f)
      .map((f) => ('name' in f ? f.name : ''))
    expect(fieldNames).toContain('siteTitle')
    expect(fieldNames).toContain('headerImage')
    expect(fieldNames).toContain('userImage')
    expect(fieldNames).toHaveLength(3)
  })

  it('has an afterChange hook for revalidation', () => {
    expect(SiteSettings.hooks).toBeDefined()
    expect(SiteSettings.hooks!.afterChange).toBeDefined()
    expect(SiteSettings.hooks!.afterChange).toHaveLength(1)
  })
})
