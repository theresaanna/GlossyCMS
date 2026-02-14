import { describe, it, expect } from 'vitest'
import { Gallery } from '../config'

describe('Gallery global config', () => {
  it('has the correct slug', () => {
    expect(Gallery.slug).toBe('gallery-settings')
  })

  it('allows public read access', () => {
    expect(Gallery.access?.read?.(undefined as any)).toBe(true)
  })

  it('has a title field with default value', () => {
    const titleField = Gallery.fields.find(
      (f) => 'name' in f && f.name === 'title',
    )
    expect(titleField).toBeDefined()
    expect(titleField && 'defaultValue' in titleField ? titleField.defaultValue : undefined).toBe('Gallery')
  })

  it('has a folder relationship field to payload-folders', () => {
    const folderField = Gallery.fields.find(
      (f) => 'name' in f && f.name === 'folder',
    ) as any
    expect(folderField).toBeDefined()
    expect(folderField.type).toBe('relationship')
    expect(folderField.relationTo).toBe('payload-folders')
  })

  it('has a limit field with default value and bounds', () => {
    const limitField = Gallery.fields.find(
      (f) => 'name' in f && f.name === 'limit',
    ) as any
    expect(limitField).toBeDefined()
    expect(limitField.type).toBe('number')
    expect(limitField.defaultValue).toBe(100)
    expect(limitField.min).toBe(1)
    expect(limitField.max).toBe(500)
  })

  it('has an afterChange hook', () => {
    expect(Gallery.hooks?.afterChange).toHaveLength(1)
  })
})
