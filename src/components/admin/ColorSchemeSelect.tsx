'use client'

import React from 'react'
import {
  useField,
  FieldLabel,
  FieldDescription,
  FieldError,
  ReactSelect,
} from '@payloadcms/ui'
import { type ColorSchemeMode, colorSchemes } from '@/colorSchemes'

const colorsByScheme = Object.fromEntries(
  colorSchemes.map((s) => [s.value, s.colors]),
) as Record<string, Partial<Record<ColorSchemeMode, readonly string[]>>>

function Swatches({ colors }: { colors: readonly string[] }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: '3px',
        marginRight: '8px',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      {colors.map((color, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            borderRadius: '2px',
            backgroundColor: color,
            border: '1px solid rgba(128,128,128,0.3)',
          }}
        />
      ))}
    </span>
  )
}

function OptionWithSwatches(props: any) {
  const { data, children, innerRef, innerProps, className, isFocused, isSelected } = props
  const mode = data?.mode as ColorSchemeMode | undefined
  const schemeColors = colorsByScheme[data?.value]
  const modeColors = mode && schemeColors?.[mode]

  return (
    <div
      ref={innerRef}
      {...innerProps}
      className={[className, isFocused && 'rs__option--is-focused', isSelected && 'rs__option--is-selected'].filter(Boolean).join(' ')}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {modeColors && <Swatches colors={modeColors} />}
        {children}
      </span>
    </div>
  )
}

function SingleValueWithSwatches(props: any) {
  const { data, children, innerProps } = props
  const mode = data?.mode as ColorSchemeMode | undefined
  const schemeColors = colorsByScheme[data?.value]
  const modeColors = mode && schemeColors?.[mode]

  return (
    <div {...innerProps} className="react-select--single-value">
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {modeColors && <Swatches colors={modeColors} />}
        {children}
      </span>
    </div>
  )
}

type Props = {
  mode: ColorSchemeMode
}

const ColorSchemeSelect: React.FC<Props> = ({ mode }) => {
  const fieldName = mode === 'light' ? 'colorSchemeLight' : 'colorSchemeDark'
  const fieldLabel = mode === 'light' ? 'Light Color Scheme' : 'Dark Color Scheme'
  const { value, setValue, showError } = useField<string>({ path: fieldName })

  const options = colorSchemes
    .filter(({ modes }) => (modes as readonly string[]).includes(mode))
    .map(({ value, label }) => ({ value, label, mode }))

  const selectedOption = options.find((o) => o.value === value) ?? options[0]

  return (
    <div
      className="field-type select"
      id={`field-${fieldName}`}
      style={{ width: '100%' }}
    >
      <FieldLabel label={fieldLabel} path={fieldName} />
      <div className="field-type__wrap">
        <FieldError path={fieldName} showError={showError} />
        <ReactSelect
          options={options}
          value={selectedOption}
          onChange={(option: any) => {
            if (!option) return
            const val = Array.isArray(option) ? option[0]?.value : option.value
            setValue(val)
          }}
          components={{
            Option: OptionWithSwatches,
            SingleValue: SingleValueWithSwatches,
          }}
          showError={showError}
        />
      </div>
      <FieldDescription
        description={`The color scheme used when the site is in ${mode} mode.`}
        path={fieldName}
      />
    </div>
  )
}

export default ColorSchemeSelect
