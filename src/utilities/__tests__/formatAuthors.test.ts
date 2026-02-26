import { describe, it, expect } from 'vitest'
import { formatAuthors } from '../formatAuthors'

describe('formatAuthors', () => {
  it('returns empty string for empty array', () => {
    expect(formatAuthors([])).toBe('')
  })

  it('returns single author name', () => {
    expect(formatAuthors([{ id: '1', name: 'Alice' }])).toBe('Alice')
  })

  it('joins two authors with "and"', () => {
    expect(
      formatAuthors([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ]),
    ).toBe('Alice and Bob')
  })

  it('joins three authors with commas and "and"', () => {
    expect(
      formatAuthors([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
      ]),
    ).toBe('Alice, Bob and Charlie')
  })

  it('joins four authors with commas and "and"', () => {
    expect(
      formatAuthors([
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' },
        { id: '4', name: 'Diana' },
      ]),
    ).toBe('Alice, Bob, Charlie and Diana')
  })

  it('filters out authors without names', () => {
    expect(
      formatAuthors([
        { id: '1', name: 'Alice' },
        { id: '2', name: undefined } as any,
        { id: '3', name: 'Charlie' },
      ]),
    ).toBe('Alice and Charlie')
  })

  it('returns empty string when all authors have no name', () => {
    expect(
      formatAuthors([
        { id: '1', name: undefined } as any,
        { id: '2', name: null } as any,
      ]),
    ).toBe('')
  })

  it('filters out authors with empty string names', () => {
    expect(
      formatAuthors([
        { id: '1', name: '' } as any,
        { id: '2', name: 'Bob' },
      ]),
    ).toBe('Bob')
  })
})
