const HIVE_API_URL = 'https://api.thehive.ai/api/v2/task/sync'

/** Confidence threshold above which an image is flagged as CSAM. */
export const CSAM_CONFIDENCE_THRESHOLD = 0.9

export interface HiveScanResult {
  /** Whether the image was flagged as CSAM */
  flagged: boolean
  /** The highest confidence score from CSAM-related classes */
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

  const formData = new FormData()
  formData.append('image', new Blob([imageBuffer]), filename)

  let response: Response
  try {
    response = await fetch(HIVE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

    let maxConfidence = 0
    let maxClass: string | null = null

    const results = data?.status || []
    for (const result of results) {
      const models = result?.response?.output || []
      for (const model of models) {
        const classes = model?.classes || []
        for (const cls of classes) {
          if (cls.class === 'yes_csam' && cls.score > maxConfidence) {
            maxConfidence = cls.score
            maxClass = cls.class
          }
        }
      }
    }

    return {
      flagged: maxConfidence >= CSAM_CONFIDENCE_THRESHOLD,
      confidence: maxConfidence,
      flaggedClass: maxConfidence >= CSAM_CONFIDENCE_THRESHOLD ? maxClass : null,
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
