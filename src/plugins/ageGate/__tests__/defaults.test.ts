import { describe, it, expect } from 'vitest'
import { resolveOptions, DEFAULT_OPTIONS } from '../defaults'

describe('resolveOptions', () => {
  it('returns all defaults when called with no arguments', () => {
    const result = resolveOptions()

    expect(result).toEqual({
      minimumAge: 18,
      storageKey: 'age-gate-verified',
      redirectUrl: '',
      enabled: true,
    })
  })

  it('returns all defaults when called with an empty object', () => {
    const result = resolveOptions({})

    expect(result).toEqual(DEFAULT_OPTIONS)
  })

  it('overrides minimumAge while keeping other defaults', () => {
    const result = resolveOptions({ minimumAge: 21 })

    expect(result.minimumAge).toBe(21)
    expect(result.storageKey).toBe('age-gate-verified')
    expect(result.redirectUrl).toBe('')
    expect(result.enabled).toBe(true)
  })

  it('overrides storageKey while keeping other defaults', () => {
    const result = resolveOptions({ storageKey: 'custom-key' })

    expect(result.storageKey).toBe('custom-key')
    expect(result.minimumAge).toBe(18)
  })

  it('overrides redirectUrl while keeping other defaults', () => {
    const result = resolveOptions({ redirectUrl: 'https://google.com' })

    expect(result.redirectUrl).toBe('https://google.com')
    expect(result.minimumAge).toBe(18)
  })

  it('overrides enabled while keeping other defaults', () => {
    const result = resolveOptions({ enabled: false })

    expect(result.enabled).toBe(false)
    expect(result.minimumAge).toBe(18)
  })

  it('allows overriding all options at once', () => {
    const custom = {
      minimumAge: 21,
      storageKey: 'my-gate',
      redirectUrl: 'https://example.com/sorry',
      enabled: false,
    }
    const result = resolveOptions(custom)

    expect(result).toEqual(custom)
  })

  it('does not mutate the input object', () => {
    const input = { minimumAge: 25 }
    const inputCopy = { ...input }
    resolveOptions(input)

    expect(input).toEqual(inputCopy)
  })

  it('uses default when minimumAge is explicitly undefined', () => {
    const result = resolveOptions({ minimumAge: undefined })

    expect(result.minimumAge).toBe(18)
  })

  it('preserves minimumAge of 0 (falsy but valid)', () => {
    const result = resolveOptions({ minimumAge: 0 })

    expect(result.minimumAge).toBe(0)
  })

  it('passes through empty string storageKey (nullish coalescing does not treat it as nullish)', () => {
    const result = resolveOptions({ storageKey: '' })

    // ?? only catches null/undefined, not empty string
    expect(result.storageKey).toBe('')
  })
})
