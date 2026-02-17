import { describe, it, expect } from 'vitest'
import { AdultContent } from '../config'

describe('AdultContent global config', () => {
  it('has the correct slug', () => {
    expect(AdultContent.slug).toBe('adult-content')
  })

  it('has the label "Adult Content"', () => {
    expect(AdultContent.label).toBe('Adult Content')
  })

  it('allows public read access', () => {
    expect(AdultContent.access?.read?.(undefined as any)).toBe(true)
  })

  it('has an enableAgeVerification checkbox field', () => {
    const field = AdultContent.fields.find(
      (f) => 'name' in f && f.name === 'enableAgeVerification',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('checkbox')
    expect(field.defaultValue).toBe(false)
  })

  it('has a minimumAge number field with correct defaults and bounds', () => {
    const field = AdultContent.fields.find(
      (f) => 'name' in f && f.name === 'minimumAge',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('number')
    expect(field.defaultValue).toBe(18)
    expect(field.min).toBe(1)
    expect(field.max).toBe(99)
  })

  it('has a redirectUrl text field', () => {
    const field = AdultContent.fields.find(
      (f) => 'name' in f && f.name === 'redirectUrl',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
  })

  it('conditionally shows minimumAge only when enableAgeVerification is true', () => {
    const field = AdultContent.fields.find(
      (f) => 'name' in f && f.name === 'minimumAge',
    ) as any

    const condition = field.admin?.condition

    expect(condition).toBeDefined()
    expect(condition({ enableAgeVerification: true })).toBe(true)
    expect(condition({ enableAgeVerification: false })).toBe(false)
    expect(condition({})).toBe(false)
    expect(condition({ enableAgeVerification: undefined })).toBe(false)
  })

  it('conditionally shows redirectUrl only when enableAgeVerification is true', () => {
    const field = AdultContent.fields.find(
      (f) => 'name' in f && f.name === 'redirectUrl',
    ) as any

    const condition = field.admin?.condition

    expect(condition).toBeDefined()
    expect(condition({ enableAgeVerification: true })).toBe(true)
    expect(condition({ enableAgeVerification: false })).toBe(false)
    expect(condition({})).toBe(false)
  })

  it('has an afterChange hook', () => {
    expect(AdultContent.hooks?.afterChange).toHaveLength(1)
  })

  it('has exactly 3 fields', () => {
    expect(AdultContent.fields).toHaveLength(3)
  })
})
