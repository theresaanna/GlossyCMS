import { describe, it, expect } from 'vitest'
import { toKebabCase } from '../toKebabCase'

describe('toKebabCase', () => {
  it('converts camelCase to kebab-case', () => {
    expect(toKebabCase('camelCase')).toBe('camel-case')
  })

  it('converts PascalCase to kebab-case', () => {
    expect(toKebabCase('PascalCase')).toBe('pascal-case')
  })

  it('replaces spaces with hyphens', () => {
    expect(toKebabCase('hello world')).toBe('hello-world')
  })

  it('converts uppercase to lowercase', () => {
    expect(toKebabCase('HELLO')).toBe('hello')
  })

  it('collapses multiple spaces into a single hyphen', () => {
    expect(toKebabCase('hello   world')).toBe('hello-world')
  })

  it('handles mixed camelCase and spaces', () => {
    expect(toKebabCase('myComponent Name')).toBe('my-component-name')
  })

  it('returns empty string for empty input', () => {
    expect(toKebabCase('')).toBe('')
  })

  it('returns already kebab-case string unchanged', () => {
    expect(toKebabCase('already-kebab')).toBe('already-kebab')
  })
})
