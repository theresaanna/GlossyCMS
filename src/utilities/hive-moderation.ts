const ARACHNID_SHIELD_URL = 'https://shield.projectarachnid.com/v1/media/'

export interface CSAMScanResult {
  /** Whether the image was flagged as CSAM or harmful/abusive material */
  flagged: boolean
  /** Classification from Arachnid Shield ('csam' | 'harmful-abusive-material' | 'no-known-match') */
  classification: string | null
  /** Match type ('exact' | 'near' | null) */
  matchType: string | null
  /** Whether the scan completed successfully */
  scanned: boolean
  /** Error message if scan failed */
  error: string | null
}

export function isCSAMScanningEnabled(): boolean {
  return !!(process.env.ARACHNID_SHIELD_USERNAME && process.env.ARACHNID_SHIELD_PASSWORD)
}

export async function scanImageForCSAM(
  imageBuffer: Buffer,
  filename: string,
): Promise<CSAMScanResult | null> {
  const username = process.env.ARACHNID_SHIELD_USERNAME
  const password = process.env.ARACHNID_SHIELD_PASSWORD
  if (!username || !password) {
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
  }
  const mimeType = mimeMap[ext] || 'image/jpeg'

  // Convert Buffer to Uint8Array for reliable cross-runtime Blob construction
  const bytes = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength)
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')

  let response: Response
  try {
    response = await fetch(ARACHNID_SHIELD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': mimeType,
        Accept: 'application/json',
      },
      body: bytes,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      flagged: false,
      classification: null,
      matchType: null,
      scanned: false,
      error: `Arachnid Shield request failed: ${message}`,
    }
  }

  if (!response.ok) {
    let errorBody = ''
    try {
      errorBody = await response.text()
    } catch {
      // ignore
    }
    console.error(`[CSAM Scan] Arachnid Shield error ${response.status}: ${errorBody}`)
    return {
      flagged: false,
      classification: null,
      matchType: null,
      scanned: false,
      error: `Arachnid Shield returned status ${response.status}`,
    }
  }

  try {
    const data = await response.json()

    // Arachnid Shield response:
    // { classification: 'csam' | 'harmful-abusive-material' | 'no-known-match',
    //   is_match: boolean, match_type: 'exact' | 'near' | null, ... }
    const classification: string = data?.classification || 'no-known-match'
    const isMatch: boolean = data?.is_match === true
    const matchType: string | null = data?.match_type || null

    const flagged = isMatch || classification === 'csam' || classification === 'harmful-abusive-material'

    return {
      flagged,
      classification,
      matchType,
      scanned: true,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      flagged: false,
      classification: null,
      matchType: null,
      scanned: false,
      error: `Failed to parse Arachnid Shield response: ${message}`,
    }
  }
}
