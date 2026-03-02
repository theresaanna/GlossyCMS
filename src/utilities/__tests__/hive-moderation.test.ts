import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scanImageForCSAM, isCSAMScanningEnabled } from '../hive-moderation'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const originalEnv = process.env

beforeEach(() => {
  vi.clearAllMocks()
  process.env = {
    ...originalEnv,
    ARACHNID_SHIELD_USERNAME: 'test-user',
    ARACHNID_SHIELD_PASSWORD: 'test-pass',
  }
})

afterEach(() => {
  process.env = originalEnv
})

/** Build an Arachnid Shield response for a clean image */
function makeCleanResponse() {
  return {
    sha1_base32: 'ABC123',
    sha256_hex: 'def456',
    classification: 'no-known-match',
    is_match: false,
    match_type: null,
    size_bytes: 1024,
    near_match_details: [],
  }
}

/** Build an Arachnid Shield response for a CSAM exact match */
function makeCSAMExactMatchResponse() {
  return {
    sha1_base32: 'XYZ789',
    sha256_hex: 'abc012',
    classification: 'csam',
    is_match: true,
    match_type: 'exact',
    size_bytes: 2048,
    near_match_details: [],
  }
}

/** Build an Arachnid Shield response for a CSAM near match */
function makeCSAMNearMatchResponse() {
  return {
    sha1_base32: 'MNO345',
    sha256_hex: 'ghi678',
    classification: 'csam',
    is_match: true,
    match_type: 'near',
    size_bytes: 3072,
    near_match_details: [
      { sha1_base32: 'REF001', sha256_hex: 'ref002', classification: 'csam', timestamp: 1234567890 },
    ],
  }
}

/** Build an Arachnid Shield response for harmful/abusive material */
function makeHarmfulResponse() {
  return {
    sha1_base32: 'HAM001',
    sha256_hex: 'ham002',
    classification: 'harmful-abusive-material',
    is_match: true,
    match_type: 'exact',
    size_bytes: 4096,
    near_match_details: [],
  }
}

describe('scanImageForCSAM', () => {
  const testBuffer = Buffer.from('fake-image-data')
  const testFilename = 'photo.jpg'

  it('sends correct request to Arachnid Shield API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCleanResponse()),
    })

    await scanImageForCSAM(testBuffer, testFilename)

    const expectedCredentials = Buffer.from('test-user:test-pass').toString('base64')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://shield.projectarachnid.com/v1/media/',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Basic ${expectedCredentials}`,
          'Content-Type': 'image/jpeg',
          Accept: 'application/json',
        },
      }),
    )
  })

  it('sends the image bytes as the request body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCleanResponse()),
    })

    await scanImageForCSAM(testBuffer, testFilename)

    const callArgs = mockFetch.mock.calls[0]
    const body = callArgs[1].body
    expect(body).toBeInstanceOf(Uint8Array)
  })

  it('returns flagged: false for clean images (no-known-match)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCleanResponse()),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(false)
    expect(result!.classification).toBe('no-known-match')
    expect(result!.matchType).toBeNull()
    expect(result!.scanned).toBe(true)
    expect(result!.error).toBeNull()
  })

  it('returns flagged: true for CSAM exact match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCSAMExactMatchResponse()),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(true)
    expect(result!.classification).toBe('csam')
    expect(result!.matchType).toBe('exact')
    expect(result!.scanned).toBe(true)
    expect(result!.error).toBeNull()
  })

  it('returns flagged: true for CSAM near match', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCSAMNearMatchResponse()),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(true)
    expect(result!.classification).toBe('csam')
    expect(result!.matchType).toBe('near')
    expect(result!.scanned).toBe(true)
  })

  it('returns flagged: true for harmful/abusive material', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeHarmfulResponse()),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.flagged).toBe(true)
    expect(result!.classification).toBe('harmful-abusive-material')
    expect(result!.matchType).toBe('exact')
    expect(result!.scanned).toBe(true)
  })

  it('returns scanned: false when API returns non-200 status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(false)
    expect(result!.flagged).toBe(false)
    expect(result!.error).toBe('Arachnid Shield returned status 500')
  })

  it('returns scanned: false when fetch throws network error', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'))

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(false)
    expect(result!.flagged).toBe(false)
    expect(result!.error).toContain('ECONNREFUSED')
  })

  it('returns null when credentials are missing', async () => {
    delete process.env.ARACHNID_SHIELD_USERNAME
    delete process.env.ARACHNID_SHIELD_PASSWORD

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null when only username is set', async () => {
    delete process.env.ARACHNID_SHIELD_PASSWORD

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('includes Basic auth header with base64-encoded credentials', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCleanResponse()),
    })

    await scanImageForCSAM(testBuffer, testFilename)

    const headers = mockFetch.mock.calls[0][1].headers
    const expectedCredentials = Buffer.from('test-user:test-pass').toString('base64')
    expect(headers.Authorization).toBe(`Basic ${expectedCredentials}`)
  })

  it('detects MIME type from filename extension', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCleanResponse()),
    })

    await scanImageForCSAM(testBuffer, 'photo.png')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Content-Type']).toBe('image/png')
  })

  it('defaults to image/jpeg for unknown extensions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeCleanResponse()),
    })

    await scanImageForCSAM(testBuffer, 'photo.xyz')

    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Content-Type']).toBe('image/jpeg')
  })

  it('handles malformed API response gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ unexpected: 'format' }),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(true)
    expect(result!.flagged).toBe(false)
    expect(result!.classification).toBe('no-known-match')
  })

  it('handles JSON parse failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    const result = await scanImageForCSAM(testBuffer, testFilename)

    expect(result!.scanned).toBe(false)
    expect(result!.error).toContain('Failed to parse Arachnid Shield response')
  })
})

describe('isCSAMScanningEnabled', () => {
  it('returns true when both credentials are set', () => {
    expect(isCSAMScanningEnabled()).toBe(true)
  })

  it('returns false when username is not set', () => {
    delete process.env.ARACHNID_SHIELD_USERNAME
    expect(isCSAMScanningEnabled()).toBe(false)
  })

  it('returns false when password is not set', () => {
    delete process.env.ARACHNID_SHIELD_PASSWORD
    expect(isCSAMScanningEnabled()).toBe(false)
  })

  it('returns false when both are not set', () => {
    delete process.env.ARACHNID_SHIELD_USERNAME
    delete process.env.ARACHNID_SHIELD_PASSWORD
    expect(isCSAMScanningEnabled()).toBe(false)
  })
})
