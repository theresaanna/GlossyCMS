import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockFindGlobal = vi.fn()
vi.mock('payload', () => ({
  getPayload: vi.fn(() => Promise.resolve({ findGlobal: mockFindGlobal })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

import AdminColorSchemeProvider from '../index'
import { AdminColorSchemeClient } from '../Client'

async function renderServerComponent(props: Parameters<typeof AdminColorSchemeProvider>[0]) {
  const jsx = await (AdminColorSchemeProvider as Function)(props)
  return render(jsx)
}

describe('AdminColorSchemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindGlobal.mockReset()
    document.documentElement.removeAttribute('data-color-scheme-light')
    document.documentElement.removeAttribute('data-color-scheme-dark')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-color-scheme-light')
    document.documentElement.removeAttribute('data-color-scheme-dark')
  })

  it('renders children', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      colorSchemeLight: 'eggplant',
      colorSchemeDark: 'eggplant',
    })

    await renderServerComponent({
      children: <div data-testid="child">Hello</div>,
    })

    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('fetches site-settings global', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      colorSchemeLight: 'default',
      colorSchemeDark: 'default',
    })

    await renderServerComponent({ children: <div /> })

    expect(mockFindGlobal).toHaveBeenCalledWith({
      slug: 'site-settings',
      depth: 0,
    })
  })

  it('defaults to "default" when findGlobal throws', async () => {
    mockFindGlobal.mockRejectedValueOnce(new Error('DB error'))

    await renderServerComponent({ children: <div /> })

    expect(document.documentElement.getAttribute('data-color-scheme-light')).toBe('default')
    expect(document.documentElement.getAttribute('data-color-scheme-dark')).toBe('default')
  })

  it('defaults to "default" when values are null', async () => {
    mockFindGlobal.mockResolvedValueOnce({
      colorSchemeLight: null,
      colorSchemeDark: null,
    })

    await renderServerComponent({ children: <div /> })

    expect(document.documentElement.getAttribute('data-color-scheme-light')).toBe('default')
    expect(document.documentElement.getAttribute('data-color-scheme-dark')).toBe('default')
  })
})

describe('AdminColorSchemeClient', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-color-scheme-light')
    document.documentElement.removeAttribute('data-color-scheme-dark')
  })

  afterEach(() => {
    document.documentElement.removeAttribute('data-color-scheme-light')
    document.documentElement.removeAttribute('data-color-scheme-dark')
  })

  it('sets data attributes on document.documentElement', () => {
    render(
      <AdminColorSchemeClient colorSchemeLight="eggplant" colorSchemeDark="default">
        <div />
      </AdminColorSchemeClient>,
    )

    expect(document.documentElement.getAttribute('data-color-scheme-light')).toBe('eggplant')
    expect(document.documentElement.getAttribute('data-color-scheme-dark')).toBe('default')
  })

  it('renders children passthrough', () => {
    render(
      <AdminColorSchemeClient colorSchemeLight="default" colorSchemeDark="default">
        <span data-testid="inner">Content</span>
      </AdminColorSchemeClient>,
    )

    expect(screen.getByTestId('inner')).toBeDefined()
    expect(screen.getByText('Content')).toBeDefined()
  })
})
