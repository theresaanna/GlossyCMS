import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveRecipients, sendNewsletterHandler } from '../sendNewsletter'

vi.mock('@payloadcms/richtext-lexical/html', () => ({
  convertLexicalToHTML: vi.fn(() => '<p>Test content</p>'),
  defaultHTMLConverters: [],
}))

describe('resolveRecipients', () => {
  let mockPayload: any
  let mockReq: any

  beforeEach(() => {
    mockPayload = {
      find: vi.fn(),
    }
    mockReq = {}
  })

  it('fetches all subscribed recipients when no recipients are specified', async () => {
    const allSubscribed = [
      { id: 1, email: 'a@test.com', status: 'subscribed' },
      { id: 2, email: 'b@test.com', status: 'subscribed' },
    ]
    mockPayload.find.mockResolvedValue({ docs: allSubscribed })

    const result = await resolveRecipients(mockPayload, mockReq, null)

    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'newsletter-recipients',
      where: { status: { equals: 'subscribed' } },
      limit: 0,
      req: mockReq,
    })
    expect(result).toEqual(allSubscribed)
  })

  it('fetches all subscribed recipients when recipients is empty array', async () => {
    const allSubscribed = [{ id: 1, email: 'a@test.com', status: 'subscribed' }]
    mockPayload.find.mockResolvedValue({ docs: allSubscribed })

    const result = await resolveRecipients(mockPayload, mockReq, [])

    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'newsletter-recipients',
      where: { status: { equals: 'subscribed' } },
      limit: 0,
      req: mockReq,
    })
    expect(result).toEqual(allSubscribed)
  })

  it('fetches all subscribed recipients when recipients is undefined', async () => {
    const allSubscribed = [{ id: 1, email: 'a@test.com', status: 'subscribed' }]
    mockPayload.find.mockResolvedValue({ docs: allSubscribed })

    const result = await resolveRecipients(mockPayload, mockReq, undefined)

    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'newsletter-recipients',
      where: { status: { equals: 'subscribed' } },
      limit: 0,
      req: mockReq,
    })
    expect(result).toEqual(allSubscribed)
  })

  it('fetches specific recipients by ID when IDs are provided', async () => {
    const selected = [{ id: 3, email: 'c@test.com', status: 'subscribed' }]
    mockPayload.find.mockResolvedValue({ docs: selected })

    const result = await resolveRecipients(mockPayload, mockReq, [3, 5])

    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'newsletter-recipients',
      where: {
        id: { in: [3, 5] },
        status: { equals: 'subscribed' },
      },
      limit: 0,
      req: mockReq,
    })
    expect(result).toEqual(selected)
  })

  it('extracts IDs from full recipient objects', async () => {
    const selected = [{ id: 10, email: 'x@test.com', status: 'subscribed' }]
    mockPayload.find.mockResolvedValue({ docs: selected })

    const recipientObjects = [
      { id: 10, email: 'x@test.com', status: 'subscribed' },
      { id: 20, email: 'y@test.com', status: 'subscribed' },
    ]

    const result = await resolveRecipients(mockPayload, mockReq, recipientObjects)

    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'newsletter-recipients',
      where: {
        id: { in: [10, 20] },
        status: { equals: 'subscribed' },
      },
      limit: 0,
      req: mockReq,
    })
    expect(result).toEqual(selected)
  })

  it('filters out unsubscribed recipients even when explicitly selected', async () => {
    // Only subscribed ones come back from the query
    mockPayload.find.mockResolvedValue({
      docs: [{ id: 1, email: 'a@test.com', status: 'subscribed' }],
    })

    const result = await resolveRecipients(mockPayload, mockReq, [1, 2])

    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('a@test.com')
  })
})

describe('sendNewsletterHandler', () => {
  let mockReq: any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-14T12:00:00.000Z'))

    mockReq = {
      user: { id: 1 },
      routeParams: { id: '42' },
      payload: {
        findByID: vi.fn(),
        find: vi.fn(),
        update: vi.fn(),
        sendEmail: vi.fn(),
      },
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockReq.user = null

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when newsletter ID is missing', async () => {
    mockReq.routeParams = {}

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Newsletter ID is required')
  })

  it('returns 400 when newsletter has already been sent', async () => {
    mockReq.payload.findByID.mockResolvedValue({ id: 42, status: 'sent', subject: 'Test' })

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Newsletter has already been sent')
  })

  it('returns 400 when newsletter has no content', async () => {
    mockReq.payload.findByID.mockResolvedValue({
      id: 42,
      status: 'draft',
      subject: 'Test',
      content: null,
    })

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Newsletter has no content')
  })

  it('returns 400 when no subscribed recipients are found', async () => {
    mockReq.payload.findByID.mockResolvedValue({
      id: 42,
      status: 'draft',
      subject: 'Test',
      content: { root: {} },
      recipients: null,
    })
    mockReq.payload.find.mockResolvedValue({ docs: [], totalDocs: 0 })

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('No subscribed recipients found')
  })

  it('sends to all subscribed recipients when no recipients are selected', async () => {
    mockReq.payload.findByID.mockResolvedValue({
      id: 42,
      status: 'draft',
      subject: 'Test Subject',
      content: { root: {} },
      recipients: null,
    })
    mockReq.payload.find.mockResolvedValue({
      docs: [
        { id: 1, email: 'alice@test.com', status: 'subscribed' },
        { id: 2, email: 'bob@test.com', status: 'subscribed' },
      ],
      totalDocs: 2,
    })
    mockReq.payload.sendEmail.mockResolvedValue(undefined)
    mockReq.payload.update.mockResolvedValue({})

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.sentCount).toBe(2)
    expect(body.totalRecipients).toBe(2)
    expect(mockReq.payload.sendEmail).toHaveBeenCalledTimes(2)
  })

  it('sends to selected recipients when recipients are specified', async () => {
    mockReq.payload.findByID.mockResolvedValue({
      id: 42,
      status: 'draft',
      subject: 'Targeted',
      content: { root: {} },
      recipients: [1, 3],
    })
    mockReq.payload.find.mockResolvedValue({
      docs: [
        { id: 1, email: 'alice@test.com', status: 'subscribed' },
        { id: 3, email: 'charlie@test.com', status: 'subscribed' },
      ],
      totalDocs: 2,
    })
    mockReq.payload.sendEmail.mockResolvedValue(undefined)
    mockReq.payload.update.mockResolvedValue({})

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.sentCount).toBe(2)
    expect(mockReq.payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: [1, 3] },
          status: { equals: 'subscribed' },
        }),
      }),
    )
  })

  it('updates newsletter status to sent after sending', async () => {
    mockReq.payload.findByID.mockResolvedValue({
      id: 42,
      status: 'draft',
      subject: 'Test',
      content: { root: {} },
      recipients: null,
    })
    mockReq.payload.find.mockResolvedValue({
      docs: [{ id: 1, email: 'test@test.com', status: 'subscribed' }],
      totalDocs: 1,
    })
    mockReq.payload.sendEmail.mockResolvedValue(undefined)
    mockReq.payload.update.mockResolvedValue({})

    await sendNewsletterHandler(mockReq)

    expect(mockReq.payload.update).toHaveBeenCalledWith({
      collection: 'newsletters',
      id: '42',
      data: {
        status: 'sent',
        sentAt: '2026-02-14T12:00:00.000Z',
        recipientCount: 1,
      },
      req: mockReq,
    })
  })

  it('reports errors for failed email sends without failing entirely', async () => {
    mockReq.payload.findByID.mockResolvedValue({
      id: 42,
      status: 'draft',
      subject: 'Test',
      content: { root: {} },
      recipients: null,
    })
    mockReq.payload.find.mockResolvedValue({
      docs: [
        { id: 1, email: 'good@test.com', status: 'subscribed' },
        { id: 2, email: 'bad@test.com', status: 'subscribed' },
      ],
      totalDocs: 2,
    })
    mockReq.payload.sendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Resend error'))
    mockReq.payload.update.mockResolvedValue({})

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(body.success).toBe(true)
    expect(body.sentCount).toBe(1)
    expect(body.totalRecipients).toBe(2)
    expect(body.errors).toHaveLength(1)
    expect(body.errors[0]).toContain('bad@test.com')
    expect(body.errors[0]).toContain('Resend error')
  })

  it('returns 500 when an unexpected error occurs', async () => {
    mockReq.payload.findByID.mockRejectedValue(new Error('Database connection failed'))

    const response = await sendNewsletterHandler(mockReq)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('Database connection failed')
  })
})
