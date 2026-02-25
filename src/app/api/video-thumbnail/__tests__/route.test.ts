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

import { POST } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSitePlan.mockReturnValue('basic')
  mockIsPrimaryInstance.mockReturnValue(false)
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
})
