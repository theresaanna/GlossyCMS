// src/utilities/videoCompression.ts
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { Readable } from 'stream'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, unlink, readFile } from 'fs/promises'
import { randomBytes } from 'crypto'

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  videoBitrate?: string
  audioBitrate?: string
  fps?: number
  format?: 'mp4' | 'webm'
  crf?: number // Quality: 23 is default, lower is better (18-28 range)
}

export async function compressVideo(
  inputBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    videoBitrate = '1000k',
    audioBitrate = '128k',
    fps = 30,
    format = 'mp4',
    crf = 23,
  } = options

  // Create temporary files
  const tempId = randomBytes(16).toString('hex')
  const inputPath = join(tmpdir(), `input-${tempId}.mp4`)
  const outputPath = join(tmpdir(), `output-${tempId}.${format}`)

  try {
    // Write input buffer to temporary file
    await writeFile(inputPath, inputBuffer)

    // Compress video
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264', // Video codec
          '-preset medium', // Encoding speed/compression ratio
          `-crf ${crf}`, // Quality
          `-b:v ${videoBitrate}`, // Video bitrate
          `-maxrate ${videoBitrate}`,
          '-bufsize 2M',
          `-vf scale='min(${maxWidth},iw)':min'(${maxHeight},ih)':force_original_aspect_ratio=decrease`, // Resize
          `-r ${fps}`, // Frame rate
          '-c:a aac', // Audio codec
          `-b:a ${audioBitrate}`, // Audio bitrate
          '-movflags +faststart', // Enable streaming
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent?.toFixed(2)}% done`)
        })
        .run()
    })

    // Read compressed file
    const compressedBuffer = await readFile(outputPath)

    return compressedBuffer
  } finally {
    // Clean up temporary files
    try {
      await unlink(inputPath)
      await unlink(outputPath)
    } catch (err) {
      console.error('Error cleaning up temp files:', err)
    }
  }
}

export async function getVideoMetadata(buffer: Buffer): Promise<{
  duration: number
  width: number
  height: number
  size: number
}> {
  const tempId = randomBytes(16).toString('hex')
  const inputPath = join(tmpdir(), `metadata-${tempId}.mp4`)

  try {
    await writeFile(inputPath, buffer)

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video')

        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          size: metadata.format.size || 0,
        })
      })
    })
  } finally {
    try {
      await unlink(inputPath)
    } catch (err) {
      console.error('Error cleaning up temp file:', err)
    }
  }
}
