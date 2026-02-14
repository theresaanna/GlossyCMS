import { describe, it, expect } from 'vitest'
import { link } from '../link'
import type { GroupField, RadioField, RowField } from 'payload'

function getTypeRadio(field: ReturnType<typeof link>): RadioField {
  const group = field as GroupField
  const firstRow = group.fields[0] as RowField
  return firstRow.fields[0] as RadioField
}

describe('link field', () => {
  describe('enableGalleryLink option', () => {
    it('does not include gallery option by default', () => {
      const field = link()
      const radio = getTypeRadio(field)

      const values = (radio.options as { value: string }[]).map((o) => o.value)
      expect(values).toEqual(['reference', 'custom'])
    })

    it('does not include gallery option when enableGalleryLink is false', () => {
      const field = link({ enableGalleryLink: false })
      const radio = getTypeRadio(field)

      const values = (radio.options as { value: string }[]).map((o) => o.value)
      expect(values).toEqual(['reference', 'custom'])
    })

    it('includes gallery option when enableGalleryLink is true', () => {
      const field = link({ enableGalleryLink: true })
      const radio = getTypeRadio(field)

      const values = (radio.options as { value: string }[]).map((o) => o.value)
      expect(values).toEqual(['reference', 'custom', 'gallery'])
    })

    it('gallery option has correct label', () => {
      const field = link({ enableGalleryLink: true })
      const radio = getTypeRadio(field)

      const galleryOption = (radio.options as { label: string; value: string }[]).find(
        (o) => o.value === 'gallery',
      )
      expect(galleryOption?.label).toBe('Gallery')
    })
  })

  describe('reference field condition', () => {
    it('reference field shows only when type is reference', () => {
      const field = link({ enableGalleryLink: true })
      const group = field as GroupField
      const secondRow = group.fields[1] as RowField
      const referenceField = secondRow.fields.find(
        (f) => 'name' in f && f.name === 'reference',
      ) as any

      expect(referenceField.admin.condition(null, { type: 'reference' })).toBe(true)
      expect(referenceField.admin.condition(null, { type: 'custom' })).toBe(false)
      expect(referenceField.admin.condition(null, { type: 'gallery' })).toBe(false)
    })
  })

  describe('url field condition', () => {
    it('url field shows only when type is custom', () => {
      const field = link({ enableGalleryLink: true })
      const group = field as GroupField
      const secondRow = group.fields[1] as RowField
      const urlField = secondRow.fields.find(
        (f) => 'name' in f && f.name === 'url',
      ) as any

      expect(urlField.admin.condition(null, { type: 'custom' })).toBe(true)
      expect(urlField.admin.condition(null, { type: 'reference' })).toBe(false)
      expect(urlField.admin.condition(null, { type: 'gallery' })).toBe(false)
    })
  })
})
