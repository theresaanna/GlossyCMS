'use client'

import React from 'react'
import { useAgeGate } from './AgeGateProvider'

export function AgeGateModal() {
  const { showGate, confirmAge, declineAge, options } = useAgeGate()

  if (!showGate) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Age verification"
      data-testid="age-gate-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Age Verification</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          You must be at least {options.minimumAge} years old to access this site.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={confirmAge}
            data-testid="age-gate-confirm"
            style={{
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            I am {options.minimumAge} or older
          </button>
          <button
            type="button"
            onClick={declineAge}
            data-testid="age-gate-decline"
            style={{
              padding: '0.5rem 1.5rem',
              cursor: 'pointer',
            }}
          >
            I am under {options.minimumAge}
          </button>
        </div>
      </div>
    </div>
  )
}
