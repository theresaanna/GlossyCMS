import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isAgeVerified, setAgeVerified, clearAgeVerified } from '../storage'

describe('storage utilities', () => {
  const TEST_KEY = 'test-age-gate'

  beforeEach(() => {
    sessionStorage.clear()
  })

  describe('isAgeVerified', () => {
    it('returns false when nothing is stored', () => {
      expect(isAgeVerified(TEST_KEY)).toBe(false)
    })

    it('returns true when the key is set to "true"', () => {
      sessionStorage.setItem(TEST_KEY, 'true')

      expect(isAgeVerified(TEST_KEY)).toBe(true)
    })

    it('returns false when the key has a non-"true" value', () => {
      sessionStorage.setItem(TEST_KEY, 'false')

      expect(isAgeVerified(TEST_KEY)).toBe(false)
    })

    it('returns false when the key has an empty string value', () => {
      sessionStorage.setItem(TEST_KEY, '')

      expect(isAgeVerified(TEST_KEY)).toBe(false)
    })

    it('uses the exact key provided', () => {
      sessionStorage.setItem('other-key', 'true')

      expect(isAgeVerified(TEST_KEY)).toBe(false)
    })

    it('returns false when sessionStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      expect(isAgeVerified(TEST_KEY)).toBe(false)

      spy.mockRestore()
    })
  })

  describe('setAgeVerified', () => {
    it('stores "true" under the given key', () => {
      setAgeVerified(TEST_KEY)

      expect(sessionStorage.getItem(TEST_KEY)).toBe('true')
    })

    it('overwrites a previous value', () => {
      sessionStorage.setItem(TEST_KEY, 'false')
      setAgeVerified(TEST_KEY)

      expect(sessionStorage.getItem(TEST_KEY)).toBe('true')
    })

    it('does not throw when sessionStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => setAgeVerified(TEST_KEY)).not.toThrow()

      spy.mockRestore()
    })

    it('stores under different keys independently', () => {
      setAgeVerified('key-a')
      setAgeVerified('key-b')

      expect(sessionStorage.getItem('key-a')).toBe('true')
      expect(sessionStorage.getItem('key-b')).toBe('true')
    })
  })

  describe('clearAgeVerified', () => {
    it('removes the stored key', () => {
      sessionStorage.setItem(TEST_KEY, 'true')
      clearAgeVerified(TEST_KEY)

      expect(sessionStorage.getItem(TEST_KEY)).toBeNull()
    })

    it('does nothing when key does not exist', () => {
      expect(() => clearAgeVerified(TEST_KEY)).not.toThrow()

      expect(sessionStorage.getItem(TEST_KEY)).toBeNull()
    })

    it('does not affect other keys', () => {
      sessionStorage.setItem(TEST_KEY, 'true')
      sessionStorage.setItem('other-key', 'value')
      clearAgeVerified(TEST_KEY)

      expect(sessionStorage.getItem('other-key')).toBe('value')
    })

    it('does not throw when sessionStorage throws', () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError')
      })

      expect(() => clearAgeVerified(TEST_KEY)).not.toThrow()

      spy.mockRestore()
    })
  })

  describe('isAgeVerified after setAgeVerified', () => {
    it('returns true after calling setAgeVerified', () => {
      expect(isAgeVerified(TEST_KEY)).toBe(false)

      setAgeVerified(TEST_KEY)

      expect(isAgeVerified(TEST_KEY)).toBe(true)
    })

    it('returns false after set then clear', () => {
      setAgeVerified(TEST_KEY)
      clearAgeVerified(TEST_KEY)

      expect(isAgeVerified(TEST_KEY)).toBe(false)
    })
  })
})
