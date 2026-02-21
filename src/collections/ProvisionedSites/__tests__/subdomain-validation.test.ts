import { describe, it, expect } from 'vitest'
import {
  RESERVED_SUBDOMAINS,
  SUBDOMAIN_REGEX,
  SUBDOMAIN_MIN_LENGTH,
  SUBDOMAIN_MAX_LENGTH,
} from '../constants'

function isValidSubdomain(subdomain: string): { valid: boolean; reason?: string } {
  if (subdomain.length < SUBDOMAIN_MIN_LENGTH || subdomain.length > SUBDOMAIN_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Must be between ${SUBDOMAIN_MIN_LENGTH} and ${SUBDOMAIN_MAX_LENGTH} characters`,
    }
  }

  if (!SUBDOMAIN_REGEX.test(subdomain)) {
    return { valid: false, reason: 'Invalid format' }
  }

  if ((RESERVED_SUBDOMAINS as readonly string[]).includes(subdomain)) {
    return { valid: false, reason: 'Reserved' }
  }

  return { valid: true }
}

describe('subdomain validation', () => {
  describe('valid subdomains', () => {
    const validNames = [
      'acme',
      'my-site',
      'test123',
      'a1b',
      'hello-world-123',
      'abc',
      'a'.repeat(63),
    ]

    it.each(validNames)('accepts "%s"', (name) => {
      expect(isValidSubdomain(name).valid).toBe(true)
    })
  })

  describe('invalid format', () => {
    const invalidNames = [
      { name: 'ab', reason: 'too short (2 chars)' },
      { name: 'a'.repeat(64), reason: 'too long (64 chars)' },
      { name: '-starts-with-hyphen', reason: 'starts with hyphen' },
      { name: 'ends-with-hyphen-', reason: 'ends with hyphen' },
      { name: 'has spaces', reason: 'contains spaces' },
      { name: 'UPPERCASE', reason: 'uppercase letters' },
      { name: 'has_underscore', reason: 'contains underscore' },
      { name: 'has.dot', reason: 'contains dot' },
      { name: 'special!char', reason: 'contains special character' },
    ]

    it.each(invalidNames)('rejects "$name" ($reason)', ({ name }) => {
      expect(isValidSubdomain(name).valid).toBe(false)
    })
  })

  describe('reserved subdomains', () => {
    const reservedNames = ['www', 'admin', 'api', 'mail', 'app', 'staging', 'test', 'dev']

    it.each(reservedNames)('rejects reserved name "%s"', (name) => {
      const result = isValidSubdomain(name)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Reserved')
    })
  })

  describe('RESERVED_SUBDOMAINS list', () => {
    it('contains all expected critical subdomains', () => {
      expect(RESERVED_SUBDOMAINS).toContain('www')
      expect(RESERVED_SUBDOMAINS).toContain('admin')
      expect(RESERVED_SUBDOMAINS).toContain('api')
      expect(RESERVED_SUBDOMAINS).toContain('mail')
      expect(RESERVED_SUBDOMAINS).toContain('staging')
    })

    it('has all entries in lowercase', () => {
      for (const name of RESERVED_SUBDOMAINS) {
        expect(name).toBe(name.toLowerCase())
      }
    })
  })

  describe('SUBDOMAIN_REGEX', () => {
    it('matches valid patterns', () => {
      expect(SUBDOMAIN_REGEX.test('abc')).toBe(true)
      expect(SUBDOMAIN_REGEX.test('a-b')).toBe(true)
      expect(SUBDOMAIN_REGEX.test('test123')).toBe(true)
    })

    it('rejects invalid patterns', () => {
      expect(SUBDOMAIN_REGEX.test('-abc')).toBe(false)
      expect(SUBDOMAIN_REGEX.test('abc-')).toBe(false)
      // Note: single char 'a' and two char 'ab' match the regex;
      // minimum length is enforced by SUBDOMAIN_MIN_LENGTH, not the regex.
      expect(SUBDOMAIN_REGEX.test('a-')).toBe(false)
      expect(SUBDOMAIN_REGEX.test('-a')).toBe(false)
    })
  })
})
