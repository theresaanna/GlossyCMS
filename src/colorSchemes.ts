/**
 * Color Scheme Registry
 *
 * To add a new color scheme:
 * 1. Add your scheme's CSS variable overrides in src/app/(frontend)/color-schemes.css
 * 2. Add an entry to the array below with a unique value and display label
 *
 * The admin UI will automatically show the new option in Site Settings.
 */
export const colorSchemes = [
  { value: 'default', label: 'Default' },
  { value: 'eggplant', label: 'Eggplant' },
  { value: 'ocean', label: 'Ocean' },
] as const

export type ColorScheme = (typeof colorSchemes)[number]['value']
