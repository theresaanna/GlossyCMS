import { describe, it, expect } from 'vitest'
import { formatDateTime } from '../formatDateTime'

// Note: formatDateTime uses local timezone via `new Date()`.
// We use noon UTC to avoid day-boundary issues across timezones.

describe('formatDateTime', () => {
  it('formats a date string as MM/DD/YYYY', () => {
    expect(formatDateTime('2026-06-15T12:00:00.000Z')).toBe('06/15/2026')
  })

  it('zero-pads single-digit months', () => {
    expect(formatDateTime('2026-01-20T12:00:00.000Z')).toBe('01/20/2026')
  })

  it('zero-pads single-digit days', () => {
    expect(formatDateTime('2026-11-05T12:00:00.000Z')).toBe('11/05/2026')
  })

  it('handles double-digit months and days', () => {
    expect(formatDateTime('2026-12-25T12:00:00.000Z')).toBe('12/25/2026')
  })

  it('handles start of year', () => {
    expect(formatDateTime('2026-01-01T12:00:00.000Z')).toBe('01/01/2026')
  })

  it('handles end of year', () => {
    expect(formatDateTime('2026-12-31T12:00:00.000Z')).toBe('12/31/2026')
  })
})
