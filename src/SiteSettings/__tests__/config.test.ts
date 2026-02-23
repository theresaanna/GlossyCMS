import { describe, it, expect } from 'vitest'
import { SiteSettings } from '../config'
import { type ColorSchemeMode, colorSchemes } from '@/colorSchemes'

/** Recursively collect all named fields, including those inside row/group fields */
function getAllNamedFields(fields: any[]): any[] {
  const result: any[] = []
  for (const f of fields) {
    if ('name' in f) {
      result.push(f)
    }
    if ('fields' in f && Array.isArray(f.fields)) {
      result.push(...getAllNamedFields(f.fields))
    }
  }
  return result
}

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

  it('has a siteDescription textarea field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'siteDescription',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('textarea')
  })

  it('has a description on the siteDescription field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'siteDescription',
    ) as any
    expect(field.admin.description).toBeDefined()
    expect(field.admin.description).toContain('description')
  })

  it('has a favicon upload field related to media', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'favicon',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('upload')
    expect(field.relationTo).toBe('media')
  })

  it('has a description on the favicon field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'favicon',
    ) as any
    expect(field.admin.description).toBeDefined()
    expect(field.admin.description).toContain('favicon')
  })

  it('has an ogImage upload field related to media', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'ogImage',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('upload')
    expect(field.relationTo).toBe('media')
  })

  it('has a description on the ogImage field', () => {
    const field = SiteSettings.fields.find(
      (f) => 'name' in f && f.name === 'ogImage',
    ) as any
    expect(field.admin.description).toBeDefined()
    expect(field.admin.description).toContain('social media previews')
  })

  it('has all expected fields', () => {
    const allFields = getAllNamedFields(SiteSettings.fields)
    const fieldNames = allFields.map((f) => f.name)
    expect(fieldNames).toContain('siteTitle')
    expect(fieldNames).toContain('siteDescription')
    expect(fieldNames).toContain('ogImage')
    expect(fieldNames).toContain('favicon')
    expect(fieldNames).toContain('headerImage')
    expect(fieldNames).toContain('userImage')
    expect(fieldNames).toContain('colorSchemeLight')
    expect(fieldNames).toContain('colorSchemeDark')
    expect(fieldNames).toContain('colorSchemeReloader')
    expect(fieldNames).toHaveLength(9)
  })

  it('has an afterChange hook for revalidation', () => {
    expect(SiteSettings.hooks).toBeDefined()
    expect(SiteSettings.hooks!.afterChange).toBeDefined()
    expect(SiteSettings.hooks!.afterChange).toHaveLength(1)
  })

  describe('color scheme fields', () => {
    const allFields = getAllNamedFields(SiteSettings.fields)

    it('has a colorSchemeLight select field', () => {
      const field = allFields.find((f) => f.name === 'colorSchemeLight')
      expect(field).toBeDefined()
      expect(field.type).toBe('select')
    })

    it('has a colorSchemeDark select field', () => {
      const field = allFields.find((f) => f.name === 'colorSchemeDark')
      expect(field).toBeDefined()
      expect(field.type).toBe('select')
    })

    it('colorSchemeLight defaults to "default"', () => {
      const field = allFields.find((f) => f.name === 'colorSchemeLight')
      expect(field.defaultValue).toBe('default')
    })

    it('colorSchemeDark defaults to "default"', () => {
      const field = allFields.find((f) => f.name === 'colorSchemeDark')
      expect(field.defaultValue).toBe('default')
    })

    it('color scheme fields use filtered options from colorSchemes registry', () => {
      const lightField = allFields.find((f) => f.name === 'colorSchemeLight')
      const darkField = allFields.find((f) => f.name === 'colorSchemeDark')
      const hasMode = (modes: readonly ColorSchemeMode[], mode: ColorSchemeMode) =>
        modes.includes(mode)
      const expectedLightOptions = colorSchemes
        .filter(({ modes }) => hasMode(modes, 'light'))
        .map(({ value, label }) => ({ value, label }))
      const expectedDarkOptions = colorSchemes
        .filter(({ modes }) => hasMode(modes, 'dark'))
        .map(({ value, label }) => ({ value, label }))
      expect(lightField.options).toEqual(expectedLightOptions)
      expect(darkField.options).toEqual(expectedDarkOptions)
    })

    it('color scheme fields are inside a row field', () => {
      const rowField = SiteSettings.fields.find((f) => 'type' in f && f.type === 'row') as any
      expect(rowField).toBeDefined()
      const rowFieldNames = rowField.fields.map((f: any) => f.name)
      expect(rowFieldNames).toContain('colorSchemeLight')
      expect(rowFieldNames).toContain('colorSchemeDark')
    })

    it('color scheme fields have descriptions', () => {
      const lightField = allFields.find((f) => f.name === 'colorSchemeLight')
      const darkField = allFields.find((f) => f.name === 'colorSchemeDark')
      expect(lightField.admin.description).toContain('light')
      expect(darkField.admin.description).toContain('dark')
    })
  })
})
