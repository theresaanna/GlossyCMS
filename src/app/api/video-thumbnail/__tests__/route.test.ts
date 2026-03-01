import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPut = vi.fn()
vi.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => mockPut(...args),
}))

const mockGetSitePlan = vi.fn()
const mockIsPrimaryInstance = vi.fn()
vi.mock('@/utilities/plan', () => ({
  getSitePlan: () => mockGetSitePlan(),
  isPrimaryInstance: () => mockIsPrimaryInstance(),
}))

const mockScanImageForCSAM = vi.fn()
vi.mock('@/utilities/hive-moderation', () => ({
  scanImageForCSAM: (...args: unknown[]) => mockScanImageForCSAM(...args),
}))

import { POST } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSitePlan.mockReturnValue('basic')
  mockIsPrimaryInstance.mockReturnValue(false)
  mockScanImageForCSAM.mockResolvedValue({
    flagged: false,
    scanned: true,
    confidence: 0.01,
    flaggedClass: null,
    error: null,
  })
  process.env.BLOB_READ_WRITE_TOKEN = 'test-token'
})

function makeThumbnailFile() {
  return new File([new Uint8Array(100)], 'thumbnail.jpg', { type: 'image/jpeg' })
}

function makeRequest(file?: File | null) {
  const formData = new FormData()
  if (file) formData.append('file', file)

  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as any
}

describe('POST /api/video-thumbnail', () => {
  it('returns 403 on basic plan without IS_PRIMARY_INSTANCE', async () => {
    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(403)

    const body = await res.json()
    expect(body.error).toMatch(/Pro plan/)
  })

  it('allows upload on pro plan', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockPut.mockResolvedValue({ url: 'https://blob.vercel-storage.com/thumb-123.jpg' })

    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.url).toBe('https://blob.vercel-storage.com/thumb-123.jpg')
  })

  it('allows upload when IS_PRIMARY_INSTANCE is true (basic plan)', async () => {
    mockIsPrimaryInstance.mockReturnValue(true)
    mockPut.mockResolvedValue({ url: 'https://blob.vercel-storage.com/thumb-456.jpg' })

    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.url).toBe('https://blob.vercel-storage.com/thumb-456.jpg')
  })

  it('returns 400 when no file is provided', async () => {
    mockGetSitePlan.mockReturnValue('pro')

    const res = await POST(makeRequest(null))
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toMatch(/No file/)
  })

  it('returns 500 when blob upload fails', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockPut.mockRejectedValue(new Error('Blob storage unavailable'))

    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.error).toMatch(/Failed to save thumbnail/)
  })

  it('uploads to Vercel Blob with correct options', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockPut.mockResolvedValue({ url: 'https://blob.vercel-storage.com/thumb.jpg' })

    await POST(makeRequest(makeThumbnailFile()))

    expect(mockPut).toHaveBeenCalledWith(
      expect.stringMatching(/^thumb-\d+-[a-z0-9]+\.jpg$/),
      expect.any(File),
      expect.objectContaining({
        access: 'public',
        token: 'test-token',
        contentType: 'image/jpeg',
        multipart: true,
      }),
    )
  })

  it('returns 400 when thumbnail is flagged by CSAM scan', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockScanImageForCSAM.mockResolvedValue({
      flagged: true,
      scanned: true,
      confidence: 0.95,
      flaggedClass: 'yes_csam',
      error: null,
    })

    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toMatch(/violates our content policy/)
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('returns 503 when CSAM scan API is unavailable', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockScanImageForCSAM.mockResolvedValue({
      flagged: false,
      scanned: false,
      confidence: 0,
      flaggedClass: null,
      error: 'Hive API returned status 500',
    })

    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.error).toMatch(/temporarily unavailable/)
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('returns 503 when HIVE_API_KEY is missing', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockScanImageForCSAM.mockRejectedValue(
      new Error('HIVE_API_KEY environment variable is required'),
    )

    const res = await POST(makeRequest(makeThumbnailFile()))
    expect(res.status).toBe(503)

    const body = await res.json()
    expect(body.error).toMatch(/temporarily unavailable/)
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('scans thumbnail before uploading to Blob', async () => {
    mockGetSitePlan.mockReturnValue('pro')
    mockPut.mockResolvedValue({ url: 'https://blob.vercel-storage.com/thumb.jpg' })

    await POST(makeRequest(makeThumbnailFile()))

    expect(mockScanImageForCSAM).toHaveBeenCalledWith(
      expect.any(Buffer),
      'thumbnail.jpg',
    )
    // Scan should be called before put
    const scanOrder = mockScanImageForCSAM.mock.invocationCallOrder[0]
    const putOrder = mockPut.mock.invocationCallOrder[0]
    expect(scanOrder).toBeLessThan(putOrder)
  })
})
