import { describe, it, expect } from 'vitest'
import { getExtension } from '../clientAudioCompression'

describe('getExtension (audio)', () => {
  it('extracts .mp3 extension', () => {
    expect(getExtension('song.mp3')).toBe('.mp3')
  })

  it('extracts .wav extension', () => {
    expect(getExtension('recording.wav')).toBe('.wav')
  })

  it('extracts .m4a extension', () => {
    expect(getExtension('podcast.m4a')).toBe('.m4a')
  })

  it('returns the filename as extension when no dot present', () => {
    // 'noext'.split('.').pop() => 'noext', so returns '.noext'
    expect(getExtension('noext')).toBe('.noext')
  })
})
