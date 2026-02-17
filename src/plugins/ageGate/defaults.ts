import type { AgeGatePluginOptions } from './types'

export const DEFAULT_OPTIONS: Required<AgeGatePluginOptions> = {
  minimumAge: 18,
  storageKey: 'age-gate-verified',
  redirectUrl: '',
  enabled: true,
}

export function resolveOptions(
  options: AgeGatePluginOptions = {},
): Required<AgeGatePluginOptions> {
  return {
    minimumAge: options.minimumAge ?? DEFAULT_OPTIONS.minimumAge,
    storageKey: options.storageKey ?? DEFAULT_OPTIONS.storageKey,
    redirectUrl: options.redirectUrl ?? DEFAULT_OPTIONS.redirectUrl,
    enabled: options.enabled ?? DEFAULT_OPTIONS.enabled,
  }
}
