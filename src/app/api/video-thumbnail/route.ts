import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getSitePlan, isPrimaryInstance } from '@/utilities/plan'

export async function POST(req: NextRequest) {
  if (getSitePlan() !== 'pro' && !isPrimaryInstance()) {
    return NextResponse.json(
      { error: 'Video uploads require the Pro plan.' },
      { status: 403 },
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const thumbFilename = `thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

    const blob = await put(thumbFilename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      contentType: 'image/jpeg',
      multipart: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Failed to save video thumbnail:', error)
    return NextResponse.json({ error: 'Failed to save thumbnail' }, { status: 500 })
  }
}
