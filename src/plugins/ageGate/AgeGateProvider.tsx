'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AgeGateContextValue, AgeGatePluginOptions } from './types'
import { resolveOptions } from './defaults'
import { isAgeVerified, setAgeVerified } from './storage'

const AgeGateContext = createContext<AgeGateContextValue | null>(null)

export function useAgeGate(): AgeGateContextValue {
  const ctx = useContext(AgeGateContext)
  if (!ctx) {
    throw new Error('useAgeGate must be used within an <AgeGateProvider>')
  }
  return ctx
}

export interface AgeGateProviderProps {
  children: React.ReactNode
  options?: AgeGatePluginOptions
}

export function AgeGateProvider({ children, options: rawOptions }: AgeGateProviderProps) {
  const options = resolveOptions(rawOptions)
  const [isVerified, setIsVerified] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    if (isAgeVerified(options.storageKey)) {
      setIsVerified(true)
    }
  }, [options.storageKey])

  const confirmAge = useCallback(() => {
    setAgeVerified(options.storageKey)
    setIsVerified(true)
  }, [options.storageKey])

  const declineAge = useCallback(() => {
    if (options.redirectUrl) {
      window.location.href = options.redirectUrl
    }
  }, [options.redirectUrl])

  const showGate = options.enabled && hasMounted && !isVerified

  const value: AgeGateContextValue = {
    isVerified,
    showGate,
    confirmAge,
    declineAge,
    options,
  }

  return <AgeGateContext.Provider value={value}>{children}</AgeGateContext.Provider>
}
