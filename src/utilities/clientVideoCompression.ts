'use client'

import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

let ffmpegInstance: FFmpeg | null = null

export function terminateFFmpeg(): void {
  if (ffmpegInstance) {
    ffmpegInstance.terminate()
    ffmpegInstance = null
  }
}

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

export async function loadFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  const ffmpeg = new FFmpeg()

  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message))
  }

  const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  })

  ffmpegInstance = ffmpeg
  return ffmpeg
}

export function getExtension(filename: string): string {
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

  // FFmpeg's progress value can plateau during the faststart moov-atom
  // relocation pass. We cap the encoding portion at 90% and reserve the
  // last 10% for the finalisation step so the bar never appears stuck.
  ffmpeg.on('progress', ({ progress }) => {
    const pct = Math.min(Math.round(progress * 90), 90)
    onProgress?.({ phase: 'compressing', percent: pct, message: `Compressing: ${pct}%` })
  })

  onProgress?.({ phase: 'compressing', percent: 0, message: 'Starting compression...' })

  const inputName = `input${getExtension(file.name)}`
  const outputName = 'output.mp4'

  const runCompression = async (ff: FFmpeg): Promise<File> => {
    await ff.writeFile(inputName, await fetchFile(file))

    await ff.exec([
      '-i',
      inputName,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
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

    onProgress?.({ phase: 'compressing', percent: 95, message: 'Finalising...' })

    const data = await ff.readFile(outputName)
    const uint8 = data as Uint8Array

    const result = new File([uint8.slice()], file.name.replace(/\.[^.]+$/, '.mp4'), {
      type: 'video/mp4',
    })

    await ff.deleteFile(inputName)
    await ff.deleteFile(outputName)
    return result
  }

  let compressedFile: File
  try {
    compressedFile = await runCompression(ffmpeg)
  } catch (err) {
    if (err instanceof WebAssembly.RuntimeError) {
      terminateFFmpeg()
      const freshFfmpeg = await loadFFmpeg()
      freshFfmpeg.on('progress', ({ progress }) => {
        const pct = Math.min(Math.round(progress * 90), 90)
        onProgress?.({ phase: 'compressing', percent: pct, message: `Compressing: ${pct}%` })
      })
      compressedFile = await runCompression(freshFfmpeg)
    } else {
      throw err
    }
  }

  const compressedSize = compressedFile.size
  const compressionRatio = Number(((1 - compressedSize / originalSize) * 100).toFixed(2))

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

  const runThumbnail = async (ff: FFmpeg): Promise<File> => {
    await ff.writeFile(inputName, await fetchFile(file))

    await ff.exec([
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

    const data = await ff.readFile(outputName)
    const uint8 = data as Uint8Array

    const result = new File([uint8.slice()], 'thumbnail.jpg', {
      type: 'image/jpeg',
    })

    await ff.deleteFile(inputName)
    await ff.deleteFile(outputName)
    return result
  }

  try {
    return await runThumbnail(ffmpeg)
  } catch (err) {
    if (err instanceof WebAssembly.RuntimeError) {
      terminateFFmpeg()
      const freshFfmpeg = await loadFFmpeg()
      return await runThumbnail(freshFfmpeg)
    }
    throw err
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
