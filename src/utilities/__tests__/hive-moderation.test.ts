import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scanImageForCSAM, CSAM_CONFIDENCE_THRESHOLD, isCSAMScanningEnabled } from '../hive-moderation'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const originalEnv = process.env

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...originalEnv, HIVE_API_KEY: 'test-hive-key' }
})

afterEach(() => {
  process.env = originalEnv
})

function makeHiveResponse(csamScore: number) {
  return {
    status: [
      {
        response: {
          output: [
            {
              classes: [
                { class: 'yes_csam', score: csamScore },
                { class: 'no_csam', score: 1 - csamScore },
              ],
            },
          ],
        },
      },
    ],
  }
}

describe('scanImageForCSAM', () => {
  const testBuffer = Buffer.from('fake-image-data')
  const testFilename = 'photo.jpg'

  it('sends correct request to Hive API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHiveResponse(0.01)),
    })

    await scanImageForCSAM(testBuffer, testFilename)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.thehive.ai/api/v2/task/sync',
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Token test-hive-key' },
      }),
    )

    const callArgs = mockFetch.mock.calls[0]
    const body = callArgs[1].body
    expect(body).toBeInstanceOf(FormData)
  })

  it('returns flagged: true when CSAM confidence exceeds threshold', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHiveResponse(0.95)),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(true)
    expect(result!.confidence).toBe(0.95)
    expect(result!.flaggedClass).toBe('yes_csam')
    expect(result!.scanned).toBe(true)
    expect(result!.error).toBeNull()
  })

  it('returns flagged: true when confidence equals threshold exactly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHiveResponse(0.9)),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(true)
    expect(result!.confidence).toBe(0.9)
  })

  it('returns flagged: false when confidence is below threshold', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHiveResponse(0.1)),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(false)
    expect(result!.confidence).toBe(0.1)
    expect(result!.flaggedClass).toBeNull()
    expect(result!.scanned).toBe(true)
    expect(result!.error).toBeNull()
  })

  it('returns flagged: false for clean images with zero score', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHiveResponse(0)),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(false)
    expect(result!.confidence).toBe(0)
    expect(result!.scanned).toBe(true)
  })

  it('returns scanned: false when API returns non-200 status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(false)
    expect(result!.flagged).toBe(false)
    expect(result!.error).toBe('Hive API returned status 500')
  })

  it('returns scanned: false when fetch throws network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(false)
    expect(result!.flagged).toBe(false)
    expect(result!.error).toContain('ECONNREFUSED')
  })

  it('returns null when HIVE_API_KEY is missing', async () => {
    delete process.env.HIVE_API_KEY

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('includes authorization header with Token prefix (not Bearer)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHiveResponse(0)),
    })

    await scanImageForCSAM(testBuffer, testFilename)

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers.Authorization).toBe('Token test-hive-key')
    expect(headers.Authorization).not.toMatch(/^Bearer/)
  })

  it('handles malformed API response gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ unexpected: 'format' }),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(true)
    expect(result!.flagged).toBe(false)
    expect(result!.confidence).toBe(0)
  })

  it('handles JSON parse failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(false)
    expect(result!.error).toContain('Failed to parse Hive API response')
  })

  it('exports CSAM_CONFIDENCE_THRESHOLD as 0.9', () => {
    expect(CSAM_CONFIDENCE_THRESHOLD).toBe(0.9)
  })
})

describe('isCSAMScanningEnabled', () => {
  it('returns true when HIVE_API_KEY is set', () => {
    expect(isCSAMScanningEnabled()).toBe(true)
  })

  it('returns false when HIVE_API_KEY is not set', () => {
    delete process.env.HIVE_API_KEY
    expect(isCSAMScanningEnabled()).toBe(false)
  })
})
