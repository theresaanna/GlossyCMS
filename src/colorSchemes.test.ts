import { describe, it, expect } from 'vitest'
import { colorSchemes } from './colorSchemes'
import type { ColorScheme } from './colorSchemes'

describe('colorSchemes', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(colorSchemes)).toBe(true)
    expect(colorSchemes.length).toBeGreaterThan(0)
  })

  it('includes a "default" scheme', () => {
    const defaultScheme = colorSchemes.find((s) => s.value === 'default')
    expect(defaultScheme).toBeDefined()
    expect(defaultScheme!.label).toBe('Default')
  })

  it('has the "default" scheme as the first entry', () => {
    expect(colorSchemes[0].value).toBe('default')
  })

  it('has unique values', () => {
    const values = colorSchemes.map((s) => s.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('each scheme has a value and label', () => {
    for (const scheme of colorSchemes) {
      expect(typeof scheme.value).toBe('string')
      expect(scheme.value.length).toBeGreaterThan(0)
      expect(typeof scheme.label).toBe('string')
      expect(scheme.label.length).toBeGreaterThan(0)
    }
  })

  it('includes an "eggplant" scheme', () => {
    const eggplantScheme = colorSchemes.find((s) => s.value === 'eggplant')
    expect(eggplantScheme).toBeDefined()
    expect(eggplantScheme!.label).toBe('Eggplant')
  })

  it('exports ColorScheme type that includes "default"', () => {
    const scheme: ColorScheme = 'default'
    expect(scheme).toBe('default')
  })

  it('each scheme has a colors object with arrays matching its modes', () => {
    for (const scheme of colorSchemes) {
      expect(scheme.colors).toBeDefined()
      for (const mode of scheme.modes) {
        const modeColors = scheme.colors[mode as keyof typeof scheme.colors]
        expect(modeColors).toBeDefined()
        expect(Array.isArray(modeColors)).toBe(true)
        expect(modeColors!.length).toBe(5)
      }
    }
  })

  it('color arrays contain valid oklch strings', () => {
    const oklchPattern = /^oklch\(.+\)$/
    for (const scheme of colorSchemes) {
      for (const mode of scheme.modes) {
        const modeColors = scheme.colors[mode as keyof typeof scheme.colors]!
        for (const color of modeColors) {
          expect(color).toMatch(oklchPattern)
        }
      }
    }
  })
})
