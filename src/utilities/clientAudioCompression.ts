'use client'

import { fetchFile } from '@ffmpeg/util'

import {
  loadFFmpeg,
  formatBytes,
  type CompressionProgress,
  type CompressionResult,
} from './clientVideoCompression'

export type { CompressionProgress, CompressionResult }

export function getExtension(filename: string): string {
  const ext = filename.split('.').pop()
  return ext ? `.${ext}` : '.mp3'
}

export async function compressAudio(
  file: File,
  onProgress?: (progress: CompressionProgress) => void,
): Promise<CompressionResult> {
  const originalSize = file.size

  onProgress?.({ phase: 'loading', percent: 0, message: 'Loading audio compressor...' })

  const ffmpeg = await loadFFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    const pct = Math.min(Math.round(progress * 100), 99)
    onProgress?.({ phase: 'compressing', percent: pct, message: `Compressing: ${pct}%` })
  })

  onProgress?.({ phase: 'compressing', percent: 0, message: 'Starting compression...' })

  const inputName = `input${getExtension(file.name)}`
  const outputName = 'output.m4a'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  await ffmpeg.exec([
    '-i',
    inputName,
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  const uint8 = data as Uint8Array

  const compressedFile = new File([uint8.slice()], file.name.replace(/\.[^.]+$/, '.m4a'), {
    type: 'audio/mp4',
  })

  const compressedSize = compressedFile.size
  const compressionRatio = Number(((1 - compressedSize / originalSize) * 100).toFixed(2))

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  onProgress?.({
    phase: 'done',
    percent: 100,
    message: `Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${compressionRatio}% reduction)`,
  })

  return { compressedFile, originalSize, compressedSize, compressionRatio }
}
