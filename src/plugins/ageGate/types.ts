export interface AgeGatePluginOptions {
  /** Minimum age required (defaults to 18) */
  minimumAge?: number
  /** Session storage key used to persist verification (defaults to 'age-gate-verified') */
  storageKey?: string
  /** URL to redirect users who decline verification (optional) */
  redirectUrl?: string
  /** Whether the age gate is enabled (defaults to true) */
  enabled?: boolean
}

export interface AgeGateContextValue {
  /** Whether the user has been verified for this session */
  isVerified: boolean
  /** Whether the age gate modal should be shown */
  showGate: boolean
  /** Call to confirm the user meets the age requirement */
  confirmAge: () => void
  /** Call when the user declines / does not meet the age requirement */
  declineAge: () => void
  /** The resolved plugin options */
  options: Required<AgeGatePluginOptions>
}
