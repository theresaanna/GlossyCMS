import { describe, it, expect } from 'vitest'
import { CallToAction } from '../config'

describe('CallToAction block config', () => {
  it('has the correct slug', () => {
    expect(CallToAction.slug).toBe('cta')
  })

  it('has the correct interfaceName', () => {
    expect(CallToAction.interfaceName).toBe('CallToActionBlock')
  })

  it('has correct labels', () => {
    expect(CallToAction.labels).toEqual({
      singular: 'Call to Action',
      plural: 'Calls to Action',
    })
  })

  it('has a heading text field', () => {
    const field = CallToAction.fields.find(
      (f) => 'name' in f && f.name === 'heading',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
    expect(field.label).toBe('Heading')
  })

  it('has a richText field', () => {
    const field = CallToAction.fields.find(
      (f) => 'name' in f && f.name === 'richText',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('richText')
  })

  it('has a links array field', () => {
    const field = CallToAction.fields.find(
      (f) => 'name' in f && f.name === 'links',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('array')
    expect(field.maxRows).toBe(2)
  })

  it('has heading as the first field', () => {
    const firstField = CallToAction.fields[0] as any
    expect(firstField.name).toBe('heading')
  })
})
