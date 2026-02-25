import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const mockSetValue = vi.fn()
const mockUseField = vi.fn(() => ({
  value: 'default',
  setValue: mockSetValue,
  showError: false,
}))

vi.mock('@payloadcms/ui', () => ({
  useField: (...args: any[]) => mockUseField(...args),
  FieldLabel: ({ label }: { label: string }) => <label>{label}</label>,
  FieldDescription: ({ description }: { description: string }) => <p>{description}</p>,
  FieldError: () => null,
  ReactSelect: ({ options, value, components }: any) => {
    const { Option, SingleValue } = components || {}
    return (
      <div data-testid="react-select">
        {SingleValue && value && (
          <div data-testid="single-value">
            <SingleValue data={value}>{value.label}</SingleValue>
          </div>
        )}
        <div data-testid="options">
          {options.map((opt: any) =>
            Option ? (
              <div key={opt.value} data-testid={`option-${opt.value}`}>
                <Option data={opt}>{opt.label}</Option>
              </div>
            ) : (
              <div key={opt.value}>{opt.label}</div>
            ),
          )}
        </div>
      </div>
    )
  },
}))


import ColorSchemeSelect from '../ColorSchemeSelect'
import { colorSchemes } from '@/colorSchemes'

describe('ColorSchemeSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseField.mockReturnValue({
      value: 'default',
      setValue: mockSetValue,
      showError: false,
    })
  })

  it('renders the light mode label and description', () => {
    render(<ColorSchemeSelect mode="light" />)
    expect(screen.getByText('Light Color Scheme')).toBeDefined()
    expect(screen.getByText('The color scheme used when the site is in light mode.')).toBeDefined()
  })

  it('renders the dark mode label and description', () => {
    render(<ColorSchemeSelect mode="dark" />)
    expect(screen.getByText('Dark Color Scheme')).toBeDefined()
    expect(screen.getByText('The color scheme used when the site is in dark mode.')).toBeDefined()
  })

  it('uses the correct field path for light mode', () => {
    render(<ColorSchemeSelect mode="light" />)
    expect(mockUseField).toHaveBeenCalledWith({ path: 'colorSchemeLight' })
  })

  it('uses the correct field path for dark mode', () => {
    render(<ColorSchemeSelect mode="dark" />)
    expect(mockUseField).toHaveBeenCalledWith({ path: 'colorSchemeDark' })
  })

  it('renders only light-compatible options for light mode', () => {
    render(<ColorSchemeSelect mode="light" />)
    const lightSchemes = colorSchemes.filter(({ modes }) =>
      (modes as readonly string[]).includes('light'),
    )
    for (const scheme of lightSchemes) {
      expect(screen.getByTestId(`option-${scheme.value}`)).toBeDefined()
    }
    // "autumn" is dark-only
    expect(screen.queryByTestId('option-autumn')).toBeNull()
  })

  it('renders only dark-compatible options for dark mode', () => {
    render(<ColorSchemeSelect mode="dark" />)
    const darkSchemes = colorSchemes.filter(({ modes }) =>
      (modes as readonly string[]).includes('dark'),
    )
    for (const scheme of darkSchemes) {
      expect(screen.getByTestId(`option-${scheme.value}`)).toBeDefined()
    }
    // "spring" is light-only
    expect(screen.queryByTestId('option-spring')).toBeNull()
  })

  it('renders color swatch spans inside options', () => {
    const { container } = render(<ColorSchemeSelect mode="light" />)
    // Target the individual swatch squares (14px x 14px spans inside the swatch container)
    const swatchSquares = container.querySelectorAll(
      '[data-testid^="option-"] span span span[style]',
    )
    // Each option has 4 swatches, and there are multiple light-mode options
    expect(swatchSquares.length).toBeGreaterThan(0)
    // Check that the inner swatch has background-color in its style attribute
    const firstSquare = swatchSquares[0] as HTMLElement
    expect(firstSquare.getAttribute('style')).toContain('background-color')
  })

  it('renders swatches in the selected single value', () => {
    const { container } = render(<ColorSchemeSelect mode="light" />)
    const singleValue = container.querySelector('[data-testid="single-value"]')
    expect(singleValue).toBeDefined()
    // Should contain swatch spans
    const swatches = singleValue!.querySelectorAll('span span[style]')
    expect(swatches.length).toBeGreaterThan(0)
  })
})
