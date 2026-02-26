import { describe, it, expect } from 'vitest'
import deepMerge, { isObject } from '../deepMerge'

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false)
    expect(isObject([1, 2, 3])).toBe(false)
  })

  it('returns true for null (typeof null === "object" in JS)', () => {
    // Note: this is a known JS quirk — isObject does not check for null
    expect(isObject(null)).toBe(true)
  })

  it('returns false for primitives', () => {
    expect(isObject('string')).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject(true)).toBe(false)
    expect(isObject(undefined)).toBe(false)
  })
})

describe('deepMerge', () => {
  it('merges flat objects', () => {
    expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 })
  })

  it('overwrites values from source', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 })
  })

  it('deeply merges nested objects', () => {
    const target = { nested: { a: 1, b: 2 } }
    const source = { nested: { b: 3, c: 4 } }
    expect(deepMerge(target, source)).toEqual({ nested: { a: 1, b: 3, c: 4 } })
  })

  it('adds new nested keys from source', () => {
    const target = { a: 1 }
    const source = { nested: { b: 2 } }
    expect(deepMerge(target, source)).toEqual({ a: 1, nested: { b: 2 } })
  })

  it('does not mutate the target', () => {
    const target = { a: 1, nested: { b: 2 } }
    const source = { nested: { c: 3 } }
    const result = deepMerge(target, source)

    expect(result).not.toBe(target)
    expect(target.nested).toEqual({ b: 2 }) // original unchanged
    expect(result.nested).toEqual({ b: 2, c: 3 })
  })

  it('handles empty source', () => {
    expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 })
  })

  it('handles empty target', () => {
    expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 })
  })

  it('recursively merges when source has nested object for existing key', () => {
    const target = { a: { x: 1 } } as any
    const source = { a: { y: 2 } }
    const result = deepMerge(target, source)
    expect(result.a).toEqual({ x: 1, y: 2 })
  })
})
