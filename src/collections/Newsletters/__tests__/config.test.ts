import { describe, it, expect } from 'vitest'
import { Newsletters } from '../index'

describe('Newsletters collection config', () => {
  it('has the correct slug', () => {
    expect(Newsletters.slug).toBe('newsletters')
  })

  it('has a subject text field that is required', () => {
    const field = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'subject',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
    expect(field.required).toBe(true)
  })

  it('has a content richText field that is required', () => {
    const field = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'content',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('richText')
    expect(field.required).toBe(true)
  })

  it('has a recipients relationship field to newsletter-recipients', () => {
    const field = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'recipients',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('relationship')
    expect(field.relationTo).toBe('newsletter-recipients')
    expect(field.hasMany).toBe(true)
  })

  it('has a description on the recipients field explaining default behavior', () => {
    const field = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'recipients',
    ) as any
    expect(field.admin.description).toContain('all subscribed recipients')
  })

  it('has a status select field with draft and sent options', () => {
    const field = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'status',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('select')
    expect(field.defaultValue).toBe('draft')
    const values = field.options.map((o: any) => o.value)
    expect(values).toContain('draft')
    expect(values).toContain('sent')
  })

  it('has sentAt and recipientCount readonly fields', () => {
    const sentAt = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'sentAt',
    ) as any
    const recipientCount = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'recipientCount',
    ) as any
    expect(sentAt).toBeDefined()
    expect(sentAt.type).toBe('date')
    expect(sentAt.admin.readOnly).toBe(true)
    expect(recipientCount).toBeDefined()
    expect(recipientCount.type).toBe('number')
    expect(recipientCount.admin.readOnly).toBe(true)
  })

  it('has a sendAction ui field', () => {
    const field = Newsletters.fields.find(
      (f) => 'name' in f && f.name === 'sendAction',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('ui')
    expect(field.admin.position).toBe('sidebar')
  })

  it('has a custom send endpoint', () => {
    expect(Newsletters.endpoints).toBeDefined()
    expect(Newsletters.endpoints).toHaveLength(1)
    const endpoint = (Newsletters.endpoints as any[])[0]
    expect(endpoint.path).toBe('/:id/send')
    expect(endpoint.method).toBe('post')
    expect(typeof endpoint.handler).toBe('function')
  })

  it('uses subject as admin title', () => {
    expect(Newsletters.admin?.useAsTitle).toBe('subject')
  })

  it('has timestamps enabled', () => {
    expect(Newsletters.timestamps).toBe(true)
  })
})
