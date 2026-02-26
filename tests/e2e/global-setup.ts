const BASE_URL = 'http://localhost:3000'

async function checkCollection(collection: string, expectedMinDocs: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/${collection}?limit=1`)

  if (!res.ok) {
    throw new Error(
      `Failed to fetch ${collection}: ${res.status}. Is the dev server running on ${BASE_URL}?`,
    )
  }

  const data = await res.json()

  if (data.totalDocs < expectedMinDocs) {
    throw new Error(
      `Expected at least ${expectedMinDocs} ${collection}, found ${data.totalDocs}. ` +
        `Seed the database before running E2E tests.`,
    )
  }
}

export default async function globalSetup() {
  try {
    await Promise.all([checkCollection('posts', 3), checkCollection('pages', 2)])
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`E2E global setup failed: ${message}`)
  }
}
