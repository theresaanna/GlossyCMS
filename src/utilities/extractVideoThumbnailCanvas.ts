'use client'

/**
 * Extract a video thumbnail using the browser's native <video> + <canvas> APIs.
 * Much lighter than FFmpeg WASM — no large downloads, no WASM memory pressure.
 */
export async function extractVideoThumbnailCanvas(
  file: File,
  options: { timestamp?: number; width?: number; timeoutMs?: number } = {},
): Promise<File> {
  const { timestamp = 1, width = 500, timeoutMs = 10_000 } = options

  const url = URL.createObjectURL(file)

  try {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = url

    // Wait for metadata so we know the video dimensions.
    // Some formats (e.g. .MOV on non-Safari browsers) may never fire
    // loadedmetadata, so we race against a timeout.
    await raceTimeout(
      new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('Failed to load video metadata'))
      }),
      timeoutMs,
      'Video metadata load timed out — format may not be supported by this browser',
    )

    // Clamp timestamp to video duration
    const seekTime = Math.min(timestamp, video.duration - 0.1)
    video.currentTime = Math.max(0, seekTime)

    // Wait for the frame at the requested time to be available
    await raceTimeout(
      new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve()
        video.onerror = () => reject(new Error('Failed to seek video'))
      }),
      timeoutMs,
      'Video seek timed out',
    )

    // Scale to requested width, preserving aspect ratio
    const scale = width / video.videoWidth
    const canvasWidth = width
    const canvasHeight = Math.round(video.videoHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas 2d context')

    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight)

    // Export as JPEG blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob returned null'))),
        'image/jpeg',
        0.85,
      )
    })

    return new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function raceTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}
