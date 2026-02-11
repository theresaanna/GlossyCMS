import { describe, it, expect } from 'vitest'
import { formatBytes, getExtension } from '../clientVideoCompression'

describe('formatBytes', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB')
  })

  it('formats fractional kilobytes', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })

  it('formats large megabyte values with decimals', () => {
    expect(formatBytes(5242880)).toBe('5 MB')
  })
})

describe('getExtension', () => {
  it('extracts .mp4 extension', () => {
    expect(getExtension('video.mp4')).toBe('.mp4')
  })

  it('extracts .mov extension', () => {
    expect(getExtension('clip.mov')).toBe('.mov')
  })

  it('extracts .avi extension', () => {
    expect(getExtension('movie.avi')).toBe('.avi')
  })

  it('handles files with multiple dots', () => {
    expect(getExtension('my.home.video.mp4')).toBe('.mp4')
  })

  it('returns the filename as extension when no dot present', () => {
    // 'noext'.split('.').pop() => 'noext', so returns '.noext'
    expect(getExtension('noext')).toBe('.noext')
  })
})
