/**
 * Color Scheme Registry
 *
 * To add a new color scheme:
 * 1. Add your scheme's CSS variable overrides in src/app/(frontend)/color-schemes.css
 * 2. Add an entry to the array below with a unique value and display label
 * 3. Set `modes` to indicate which theme modes the scheme supports:
 *    - ['light', 'dark'] — appears in both pickers (default)
 *    - ['light'] — only appears in the light color scheme picker
 *    - ['dark'] — only appears in the dark color scheme picker
 *
 * The admin UI will automatically show the new option in Site Settings.
 */
export const colorSchemes = [
  { value: 'default', label: 'Default', modes: ['light', 'dark'] },
  { value: 'eggplant', label: 'Eggplant', modes: ['light', 'dark'] },
  { value: 'ocean', label: 'Ocean', modes: ['light', 'dark'] },
  { value: 'spring', label: 'Spring', modes: ['light'] },
  { value: 'autumn', label: 'Autumn', modes: ['dark'] },
  { value: '80s', label: "80's", modes: ['light', 'dark'] },
] as const

export type ColorScheme = (typeof colorSchemes)[number]['value']
export type ColorSchemeMode = 'light' | 'dark'
