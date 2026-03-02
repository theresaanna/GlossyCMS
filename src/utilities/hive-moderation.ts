const HIVE_API_URL = 'https://api.thehive.ai/api/v2/task/sync'

/** Confidence threshold above which an image is flagged as CSAM. */
export const CSAM_CONFIDENCE_THRESHOLD = 0.9

export interface HiveScanResult {
  /** Whether the image was flagged as CSAM */
  flagged: boolean
  /** The highest confidence score from the CSAM classifier class */
  confidence: number
  /** Raw class name from Hive that triggered the flag (for audit logging) */
  flaggedClass: string | null
  /** Whether the scan completed successfully */
  scanned: boolean
  /** Error message if scan failed */
  error: string | null
}

export function isCSAMScanningEnabled(): boolean {
  return !!process.env.HIVE_API_KEY
}

export async function scanImageForCSAM(
  imageBuffer: Buffer,
  filename: string,
): Promise<HiveScanResult | null> {
  const apiKey = process.env.HIVE_API_KEY
  if (!apiKey) {
    return null
  }

  // Determine MIME type from filename extension
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  }
  const mimeType = mimeMap[ext] || 'image/jpeg'

  // Convert Buffer to Uint8Array to avoid potential Node.js Buffer/Blob issues
  const bytes = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength)
  const file = new File([bytes], filename, { type: mimeType })

  const formData = new FormData()
  formData.append('media', file)

  let response: Response
  try {
    response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: 'application/json',
      },
      body: formData,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      flagged: false,
      confidence: 0,
      flaggedClass: null,
      scanned: false,
      error: `Hive API request failed: ${message}`,
    }
  }

  if (!response.ok) {
    let errorBody = ''
    try {
      errorBody = await response.text()
    } catch {
      // ignore
    }
    console.error(`[CSAM Scan] Hive API error ${response.status}: ${errorBody}`)
    return {
      flagged: false,
      confidence: 0,
      flaggedClass: null,
      scanned: false,
      error: `Hive API returned status ${response.status}`,
    }
  }

  try {
    const data = await response.json()

    // Hive CSAM combined API response structure:
    // { status: [{ response: { output: { file: { reasons: [...], classifierPrediction: { csam_classifier: { csam: 0.98, pornography: 0.01, other: 0.01 } } } } } }] }
    let csamScore = 0
    let flaggedReason: string | null = null

    const results = data?.status || []
    for (const result of results) {
      const output = result?.response?.output
      if (!output?.file) continue

      // Check hash matching results (reasons array contains "matched" for known CSAM)
      const reasons: string[] = output.file.reasons || []
      if (reasons.includes('matched') || reasons.includes('csam')) {
        return {
          flagged: true,
          confidence: 1,
          flaggedClass: reasons.includes('matched') ? 'hash_match' : 'csam',
          scanned: true,
          error: null,
        }
      }

      // Check classifier predictions
      const classifier = output.file.classifierPrediction?.csam_classifier
      if (classifier && classifier.csam > csamScore) {
        csamScore = classifier.csam
        flaggedReason = 'csam'
      }
    }

    return {
      flagged: csamScore >= CSAM_CONFIDENCE_THRESHOLD,
      confidence: csamScore,
      flaggedClass: csamScore >= CSAM_CONFIDENCE_THRESHOLD ? flaggedReason : null,
      scanned: true,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      flagged: false,
      confidence: 0,
      flaggedClass: null,
      scanned: false,
      error: `Failed to parse Hive API response: ${message}`,
    }
  }
}
