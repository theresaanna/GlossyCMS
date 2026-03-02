import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockScanImageForCSAM = vi.fn()
vi.mock('@/utilities/hive-moderation', () => ({
  scanImageForCSAM: (...args: unknown[]) => mockScanImageForCSAM(...args),
}))

import { scanImageUpload } from '../scanImageUpload'

beforeEach(() => {
  vi.clearAllMocks()
})

function makeArgs(
  overrides: {
    operation?: 'create' | 'update'
    mimetype?: string
    fileName?: string
    fileData?: Buffer | null
  } = {},
) {
  const {
    operation = 'create',
    mimetype = 'image/jpeg',
    fileName = 'photo.jpg',
    fileData = Buffer.from('fake-image-data'),
  } = overrides

  return {
    operation,
    data: { alt: 'test image' },
    req: {
      file:
        fileData !== null
          ? { mimetype, name: fileName, data: fileData, size: fileData?.length || 0 }
          : undefined,
    },
  } as any
}

function cleanResult(overrides: Partial<{ flagged: boolean; scanned: boolean; classification: string | null; matchType: string | null; error: string | null }> = {}) {
  return {
    flagged: false,
    scanned: true,
    classification: 'no-known-match',
    matchType: null,
    error: null,
    ...overrides,
  }
}

describe('scanImageUpload hook', () => {
  it('allows upload when scan returns clean result', async () => {
    mockScanImageForCSAM.mockResolvedValue(cleanResult())

    const args = makeArgs()
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
  })

  it('blocks upload when scan returns flagged result', async () => {
    mockScanImageForCSAM.mockResolvedValue(
      cleanResult({ flagged: true, classification: 'csam', matchType: 'exact' }),
    )

    await expect(scanImageUpload(makeArgs())).rejects.toThrow(
      'This image cannot be uploaded because it violates our content policy.',
    )
  })

  it('blocks with status 400 when flagged', async () => {
    mockScanImageForCSAM.mockResolvedValue(
      cleanResult({ flagged: true, classification: 'csam', matchType: 'exact' }),
    )

    try {
      await scanImageUpload(makeArgs())
      expect.fail('Should have thrown')
    } catch (error: any) {
      expect(error.status).toBe(400)
    }
  })

  it('blocks upload when scan API is unavailable (fail closed)', async () => {
    mockScanImageForCSAM.mockResolvedValue(
      cleanResult({ scanned: false, error: 'Arachnid Shield returned status 500' }),
    )

    await expect(scanImageUpload(makeArgs())).rejects.toThrow(
      'Image upload is temporarily unavailable. Please try again later.',
    )
  })

  it('blocks with status 503 when API is unavailable', async () => {
    mockScanImageForCSAM.mockResolvedValue(
      cleanResult({ scanned: false, error: 'API timeout' }),
    )

    try {
      await scanImageUpload(makeArgs())
      expect.fail('Should have thrown')
    } catch (error: any) {
      expect(error.status).toBe(503)
    }
  })

  it('allows upload when credentials are not configured (returns null)', async () => {
    mockScanImageForCSAM.mockResolvedValue(null)
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const args = makeArgs()
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Arachnid Shield credentials are not configured'),
    )

    consoleSpy.mockRestore()
  })

  it('skips scanning for non-image MIME types', async () => {
    const args = makeArgs({ mimetype: 'video/mp4' })
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
    expect(mockScanImageForCSAM).not.toHaveBeenCalled()
  })

  it('skips scanning for audio MIME types', async () => {
    const args = makeArgs({ mimetype: 'audio/mpeg' })
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
    expect(mockScanImageForCSAM).not.toHaveBeenCalled()
  })

  it('skips scanning on update operations', async () => {
    const args = makeArgs({ operation: 'update' })
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
    expect(mockScanImageForCSAM).not.toHaveBeenCalled()
  })

  it('skips scanning when req.file is absent', async () => {
    const args = makeArgs({ fileData: null })
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
    expect(mockScanImageForCSAM).not.toHaveBeenCalled()
  })

  it('skips scanning when buffer is empty', async () => {
    const args = makeArgs({ fileData: Buffer.alloc(0) })
    const result = await scanImageUpload(args)

    expect(result).toEqual(args.data)
    expect(mockScanImageForCSAM).not.toHaveBeenCalled()
  })

  it('passes the file buffer and name to scanImageForCSAM', async () => {
    mockScanImageForCSAM.mockResolvedValue(cleanResult())

    const fileData = Buffer.from('specific-image-bytes')
    await scanImageUpload(makeArgs({ fileData, fileName: 'specific-photo.png' }))

    expect(mockScanImageForCSAM).toHaveBeenCalledWith(fileData, 'specific-photo.png')
  })

  it('logs scan results for audit trail', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockScanImageForCSAM.mockResolvedValue(cleanResult())

    await scanImageUpload(makeArgs({ fileName: 'audit-test.jpg' }))

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CSAM Scan]'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('audit-test.jpg'),
    )

    consoleSpy.mockRestore()
  })

  it('logs error when API is unavailable', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockScanImageForCSAM.mockResolvedValue(
      cleanResult({ scanned: false, error: 'Connection refused' }),
    )

    try {
      await scanImageUpload(makeArgs())
    } catch {
      // expected
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CSAM Scan] API unavailable'),
    )

    consoleErrorSpy.mockRestore()
  })
})
