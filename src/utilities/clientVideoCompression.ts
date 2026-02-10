'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null

export interface CompressionProgress {
  phase: 'loading' | 'compressing' | 'done' | 'error'
  percent: number
  message: string
}

export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  const ffmpeg = new FFmpeg()

  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message))
  }

  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  ffmpegInstance = ffmpeg
  return ffmpeg
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()
  return ext ? `.${ext}` : '.mp4'
}

export async function compressVideo(
  file: File,
  onProgress?: (progress: CompressionProgress) => void,
): Promise<CompressionResult> {
  const originalSize = file.size

  onProgress?.({ phase: 'loading', percent: 0, message: 'Loading video compressor...' })

  const ffmpeg = await loadFFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    const pct = Math.min(Math.round(progress * 100), 99)
    onProgress?.({ phase: 'compressing', percent: pct, message: `Compressing: ${pct}%` })
  })

  onProgress?.({ phase: 'compressing', percent: 0, message: 'Starting compression...' })

  const inputName = `input${getExtension(file.name)}`
  const outputName = 'output.mp4'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  await ffmpeg.exec([
    '-i',
    inputName,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '28',
    '-maxrate',
    '1500k',
    '-bufsize',
    '2M',
    '-vf',
    "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
    '-r',
    '30',
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

  const compressedFile = new File([uint8.slice()], file.name.replace(/\.[^.]+$/, '.mp4'), {
    type: 'video/mp4',
  })

  const compressedSize = compressedFile.size
  const compressionRatio = Number(((1 - compressedSize / originalSize) * 100).toFixed(2))

  // Clean up virtual FS
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  onProgress?.({
    phase: 'done',
    percent: 100,
    message: `Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${compressionRatio}% reduction)`,
  })

  return { compressedFile, originalSize, compressedSize, compressionRatio }
}

export async function extractVideoThumbnail(
  file: File,
  options: { timestamp?: number; width?: number } = {},
): Promise<File> {
  const { timestamp = 1, width = 500 } = options

  const ffmpeg = await loadFFmpeg()

  const inputName = `thumb-input${getExtension(file.name)}`
  const outputName = 'thumbnail.jpg'

  await ffmpeg.writeFile(inputName, await fetchFile(file))

  await ffmpeg.exec([
    '-ss',
    String(timestamp),
    '-i',
    inputName,
    '-vframes',
    '1',
    '-vf',
    `scale=${width}:-1`,
    '-q:v',
    '2',
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  const uint8 = data as Uint8Array

  const thumbnailFile = new File([uint8.slice()], 'thumbnail.jpg', {
    type: 'image/jpeg',
  })

  // Clean up virtual FS
  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  return thumbnailFile
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
