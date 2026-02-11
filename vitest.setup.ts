// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'

// Auto-cleanup DOM after each test for @testing-library/react
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
