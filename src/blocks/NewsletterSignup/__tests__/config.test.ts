import { describe, it, expect } from 'vitest'
import { NewsletterSignup } from '../config'

describe('NewsletterSignup block config', () => {
  it('has the correct slug', () => {
    expect(NewsletterSignup.slug).toBe('newsletterSignup')
  })

  it('has the correct interfaceName', () => {
    expect(NewsletterSignup.interfaceName).toBe('NewsletterSignupBlock')
  })

  it('has a heading text field with default value', () => {
    const field = NewsletterSignup.fields.find(
      (f) => 'name' in f && f.name === 'heading',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
    expect(field.defaultValue).toBe('Subscribe to our newsletter')
  })

  it('has a description textarea field', () => {
    const field = NewsletterSignup.fields.find(
      (f) => 'name' in f && f.name === 'description',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('textarea')
  })

  it('has a successMessage text field with default value', () => {
    const field = NewsletterSignup.fields.find(
      (f) => 'name' in f && f.name === 'successMessage',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
    expect(field.defaultValue).toBe('Thank you for subscribing!')
  })

  it('has correct labels', () => {
    expect(NewsletterSignup.labels).toEqual({
      singular: 'Newsletter Signup',
      plural: 'Newsletter Signups',
    })
  })
})
