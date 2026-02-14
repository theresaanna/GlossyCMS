import { describe, it, expect } from 'vitest'
import { NewsletterRecipients } from '../index'

describe('NewsletterRecipients collection config', () => {
  it('has the correct slug', () => {
    expect(NewsletterRecipients.slug).toBe('newsletter-recipients')
  })

  it('has an email field that is required and unique', () => {
    const field = NewsletterRecipients.fields.find(
      (f) => 'name' in f && f.name === 'email',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('email')
    expect(field.required).toBe(true)
    expect(field.unique).toBe(true)
  })

  it('has a name text field', () => {
    const field = NewsletterRecipients.fields.find(
      (f) => 'name' in f && f.name === 'name',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
  })

  it('has a status select field with correct options', () => {
    const field = NewsletterRecipients.fields.find(
      (f) => 'name' in f && f.name === 'status',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('select')
    expect(field.defaultValue).toBe('subscribed')
    const values = field.options.map((o: any) => o.value)
    expect(values).toContain('subscribed')
    expect(values).toContain('unsubscribed')
  })

  it('has subscribedAt and unsubscribedAt date fields', () => {
    const subscribedAt = NewsletterRecipients.fields.find(
      (f) => 'name' in f && f.name === 'subscribedAt',
    ) as any
    const unsubscribedAt = NewsletterRecipients.fields.find(
      (f) => 'name' in f && f.name === 'unsubscribedAt',
    ) as any
    expect(subscribedAt).toBeDefined()
    expect(subscribedAt.type).toBe('date')
    expect(subscribedAt.admin.readOnly).toBe(true)
    expect(unsubscribedAt).toBeDefined()
    expect(unsubscribedAt.type).toBe('date')
    expect(unsubscribedAt.admin.readOnly).toBe(true)
  })

  it('only shows unsubscribedAt when status is unsubscribed', () => {
    const field = NewsletterRecipients.fields.find(
      (f) => 'name' in f && f.name === 'unsubscribedAt',
    ) as any
    const condition = field.admin.condition
    expect(condition({ status: 'unsubscribed' })).toBe(true)
    expect(condition({ status: 'subscribed' })).toBe(false)
    expect(condition({})).toBe(false)
  })

  it('uses correct access control', () => {
    expect(NewsletterRecipients.access).toBeDefined()
    // create should allow anyone (returns true always)
    expect(NewsletterRecipients.access!.create!({} as any)).toBe(true)
  })

  it('uses email as admin title', () => {
    expect(NewsletterRecipients.admin?.useAsTitle).toBe('email')
  })

  it('has timestamps enabled', () => {
    expect(NewsletterRecipients.timestamps).toBe(true)
  })
})
