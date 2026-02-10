import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const thumbFilename = `thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

    const blob = await put(thumbFilename, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      contentType: 'image/jpeg',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Failed to save video thumbnail:', error)
    return NextResponse.json({ error: 'Failed to save thumbnail' }, { status: 500 })
  }
}
