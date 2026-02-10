import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { writeFile } from 'fs/promises'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const thumbFilename = `thumb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
    const thumbPath = path.resolve(process.cwd(), 'public/media', thumbFilename)

    await writeFile(thumbPath, buffer)

    return NextResponse.json({ url: `/media/${thumbFilename}` })
  } catch (error) {
    console.error('Failed to save video thumbnail:', error)
    return NextResponse.json({ error: 'Failed to save thumbnail' }, { status: 500 })
  }
}
