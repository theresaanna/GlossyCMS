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
 * 4. Add `colors` with representative preview colors for the admin dropdown:
 *    - `light` and/or `dark` arrays matching the modes you support
 *    - Each array should contain 5 oklch color strings: background, foreground, primary, secondary, accent
 *
 * The admin UI will automatically show the new option in Site Settings.
 */
export const colorSchemes = [
  {
    value: 'default',
    label: 'Default',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(100% 0 0deg)',
        'oklch(25% 0.02 230deg)',
        'oklch(67.6% 0.134 229.8deg)',
        'oklch(86.7% 0.069 117.8deg)',
        'oklch(86.8% 0.046 184.4deg)',
      ],
      dark: [
        'oklch(23.1% 0.039 180.5deg)',
        'oklch(89.6% 0.019 176.6deg)',
        'oklch(89.6% 0.019 176.6deg)',
        'oklch(26.6% 0.022 171.9deg)',
        'oklch(26.6% 0.022 171.9deg)',
      ],
    },
  },
  {
    value: 'eggplant',
    label: 'Eggplant',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(94.3% 0.021 337.5deg)',
        'oklch(22.7% 0.020 303.0deg)',
        'oklch(35.3% 0.051 322.4deg)',
        'oklch(92.1% 0.010 320.2deg)',
        'oklch(92.1% 0.010 320.2deg)',
      ],
      dark: [
        'oklch(22.7% 0.020 303.0deg)',
        'oklch(94.3% 0.021 337.5deg)',
        'oklch(53.7% 0.063 319.4deg)',
        'oklch(27.5% 0.022 329.4deg)',
        'oklch(27.5% 0.022 329.4deg)',
      ],
    },
  },
  {
    value: 'ocean',
    label: 'Ocean',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(97.5% 0.012 212.0deg)',
        'oklch(34.4% 0.086 244.7deg)',
        'oklch(36.4% 0.082 238.8deg)',
        'oklch(87.4% 0.056 211.9deg)',
        'oklch(87.4% 0.056 211.9deg)',
      ],
      dark: [
        'oklch(34.4% 0.086 244.7deg)',
        'oklch(87.4% 0.056 211.9deg)',
        'oklch(68.2% 0.083 209.9deg)',
        'oklch(36.4% 0.082 238.8deg)',
        'oklch(36.4% 0.082 238.8deg)',
      ],
    },
  },
  {
    value: 'spring',
    label: 'Spring',
    modes: ['light'],
    colors: {
      light: [
        'oklch(91.2% 0.049 0.5deg)',
        'oklch(34.6% 0.045 342.2deg)',
        'oklch(41.2% 0.070 7.5deg)',
        'oklch(93.2% 0.074 108.6deg)',
        'oklch(83.0% 0.048 61.9deg)',
      ],
    },
  },
  {
    value: 'autumn',
    label: 'Autumn',
    modes: ['dark'],
    colors: {
      dark: [
        'oklch(25.0% 0.033 3.4deg)',
        'oklch(90.8% 0.014 11.7deg)',
        'oklch(54.9% 0.059 358.0deg)',
        'oklch(37.8% 0.037 88.3deg)',
        'oklch(43.4% 0.037 21.1deg)',
      ],
    },
  },
  {
    value: 'cherry',
    label: 'Cherry',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(98.0% 0.005 25deg)',
        'oklch(32.3% 0.009 285.8deg)',
        'oklch(41.6% 0.148 26.6deg)',
        'oklch(68.4% 0.015 67.5deg)',
        'oklch(68.4% 0.015 67.5deg)',
      ],
      dark: [
        'oklch(32.3% 0.009 285.8deg)',
        'oklch(92.0% 0.008 25deg)',
        'oklch(52.3% 0.174 25.6deg)',
        'oklch(43.4% 0.013 285.8deg)',
        'oklch(43.4% 0.013 285.8deg)',
      ],
    },
  },
  {
    value: 'ink-wash',
    label: 'Ink Wash',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(96.5% 0.005 70deg)',
        'oklch(22.0% 0.005 70deg)',
        'oklch(22.0% 0.005 70deg)',
        'oklch(90.0% 0.005 70deg)',
        'oklch(90.0% 0.005 70deg)',
      ],
      dark: [
        'oklch(22.0% 0.005 70deg)',
        'oklch(85.0% 0.005 70deg)',
        'oklch(85.0% 0.005 70deg)',
        'oklch(27.0% 0.005 70deg)',
        'oklch(30.0% 0.005 70deg)',
      ],
    },
  },
  {
    value: 'rose-quartz',
    label: 'Rose Quartz',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(96.0% 0.008 15deg)',
        'oklch(33.0% 0.095 12deg)',
        'oklch(50.0% 0.130 18deg)',
        'oklch(91.0% 0.008 15deg)',
        'oklch(76.0% 0.095 15deg)',
      ],
      dark: [
        'oklch(24.0% 0.04 12deg)',
        'oklch(89.0% 0.006 20deg)',
        'oklch(56.0% 0.12 18deg)',
        'oklch(30.0% 0.05 15deg)',
        'oklch(35.0% 0.06 15deg)',
      ],
    },
  },
  {
    value: 'calcite',
    label: 'Calcite',
    modes: ['dark'],
    colors: {
      dark: [
        'oklch(28.0% 0.008 240deg)',
        'oklch(89.0% 0.003 70deg)',
        'oklch(72.0% 0.16 50deg)',
        'oklch(33.0% 0.008 240deg)',
        'oklch(36.0% 0.015 50deg)',
      ],
    },
  },
  {
    value: 'amethyst-dawn-haze',
    label: 'Amethyst Dawn Haze',
    modes: ['dark'],
    colors: {
      dark: [
        'oklch(24.0% 0.13 290deg)',
        'oklch(78.0% 0.10 290deg)',
        'oklch(84.0% 0.16 100deg)',
        'oklch(30.0% 0.08 300deg)',
        'oklch(33.0% 0.07 310deg)',
      ],
    },
  },
  {
    value: 'frosted-aura',
    label: 'Frosted Aura',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(100% 0 0deg)',
        'oklch(46.0% 0.03 230deg)',
        'oklch(46.0% 0.03 230deg)',
        'oklch(91.0% 0.01 230deg)',
        'oklch(87.0% 0.015 230deg)',
      ],
      dark: [
        'oklch(24.0% 0.015 230deg)',
        'oklch(91.0% 0.01 230deg)',
        'oklch(87.0% 0.015 230deg)',
        'oklch(30.0% 0.02 230deg)',
        'oklch(34.0% 0.02 230deg)',
      ],
    },
  },
  {
    value: 'tropical-sunrise',
    label: 'Tropical Sunrise',
    modes: ['light'],
    colors: {
      light: [
        'oklch(97.5% 0.01 80deg)',
        'oklch(50.0% 0.08 200deg)',
        'oklch(50.0% 0.08 200deg)',
        'oklch(88.0% 0.04 145deg)',
        'oklch(88.0% 0.06 45deg)',
      ],
    },
  },
  {
    value: 'tropical-sunset',
    label: 'Tropical Sunset',
    modes: ['dark'],
    colors: {
      dark: [
        'oklch(24.0% 0.04 200deg)',
        'oklch(90.0% 0.04 80deg)',
        'oklch(78.0% 0.10 45deg)',
        'oklch(30.0% 0.04 200deg)',
        'oklch(34.0% 0.04 45deg)',
      ],
    },
  },
  {
    value: 'tropical-heat',
    label: 'Tropical Heat',
    modes: ['light'],
    colors: {
      light: [
        'oklch(97.0% 0.02 85deg)',
        'oklch(35.0% 0.10 30deg)',
        'oklch(55.0% 0.18 30deg)',
        'oklch(90.0% 0.05 85deg)',
        'oklch(82.0% 0.10 55deg)',
      ],
    },
  },
  {
    value: 'urban',
    label: 'Urban',
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(95.0% 0.003 100deg)',
        'oklch(15.0% 0.003 0deg)',
        'oklch(15.0% 0.003 0deg)',
        'oklch(88.0% 0.003 100deg)',
        'oklch(88.0% 0.14 105deg)',
      ],
      dark: [
        'oklch(15.0% 0.003 0deg)',
        'oklch(88.0% 0.003 100deg)',
        'oklch(88.0% 0.14 105deg)',
        'oklch(22.0% 0.003 0deg)',
        'oklch(28.0% 0.003 0deg)',
      ],
    },
  },
  {
    value: '80s',
    label: "80's",
    modes: ['light', 'dark'],
    colors: {
      light: [
        'oklch(96.5% 0.012 350deg)',
        'oklch(20.0% 0.030 260deg)',
        'oklch(55.0% 0.200 344deg)',
        'oklch(82.0% 0.080 195deg)',
        'oklch(62.0% 0.170 305deg)',
      ],
      dark: [
        'oklch(18.0% 0.040 240deg)',
        'oklch(92.0% 0.030 195deg)',
        'oklch(68.0% 0.200 344deg)',
        'oklch(28.0% 0.050 195deg)',
        'oklch(55.0% 0.140 305deg)',
      ],
    },
  },
] as const

export type ColorScheme = (typeof colorSchemes)[number]['value']
export type ColorSchemeMode = 'light' | 'dark'
