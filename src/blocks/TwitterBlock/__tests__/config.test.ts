import { describe, it, expect } from 'vitest'
import { TwitterBlock } from '../config'

describe('TwitterBlock config', () => {
  it('has the correct slug', () => {
    expect(TwitterBlock.slug).toBe('twitter')
  })

  it('has the correct interfaceName', () => {
    expect(TwitterBlock.interfaceName).toBe('TwitterBlock')
  })

  it('has correct labels', () => {
    expect(TwitterBlock.labels).toEqual({
      plural: 'Twitter Embeds',
      singular: 'Twitter Embed',
    })
  })

  it('has a required username text field', () => {
    const usernameField = TwitterBlock.fields.find(
      (f) => 'name' in f && f.name === 'username',
    ) as any
    expect(usernameField).toBeDefined()
    expect(usernameField.type).toBe('text')
    expect(usernameField.required).toBe(true)
  })

  it('has an optional title text field', () => {
    const titleField = TwitterBlock.fields.find(
      (f) => 'name' in f && f.name === 'title',
    ) as any
    expect(titleField).toBeDefined()
    expect(titleField.type).toBe('text')
    expect(titleField.required).toBeUndefined()
  })

  it('has a tweetLimit number field with default and bounds', () => {
    const tweetLimitField = TwitterBlock.fields.find(
      (f) => 'name' in f && f.name === 'tweetLimit',
    ) as any
    expect(tweetLimitField).toBeDefined()
    expect(tweetLimitField.type).toBe('number')
    expect(tweetLimitField.defaultValue).toBe(10)
    expect(tweetLimitField.min).toBe(1)
    expect(tweetLimitField.max).toBe(20)
  })

  describe('username validation', () => {
    const usernameField = TwitterBlock.fields.find(
      (f) => 'name' in f && f.name === 'username',
    ) as any
    const validate = usernameField.validate

    it('accepts a valid username', () => {
      expect(validate('testuser')).toBe(true)
    })

    it('accepts usernames with underscores and numbers', () => {
      expect(validate('test_user_123')).toBe(true)
    })

    it('rejects empty username', () => {
      expect(validate('')).toBe('Username is required')
    })

    it('rejects null/undefined username', () => {
      expect(validate(null)).toBe('Username is required')
      expect(validate(undefined)).toBe('Username is required')
    })

    it('rejects usernames with special characters', () => {
      expect(validate('test-user')).toMatch(/must be 1-15 characters/)
      expect(validate('test@user')).toMatch(/must be 1-15 characters/)
    })

    it('rejects usernames longer than 15 characters', () => {
      expect(validate('a'.repeat(16))).toMatch(/must be 1-15 characters/)
    })
  })
})
