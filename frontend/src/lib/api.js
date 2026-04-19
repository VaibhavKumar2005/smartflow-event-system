// In production (Cloud Run), set VITE_API_URL to your deployed backend URL.
// In development, falls back to '/api' so the Vite proxy handles it.
const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

/**
 * Fetch with timeout and retry.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} retries
 */
async function fetchWithRetry(url, options = {}, retries = 1) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    return res
  } catch (err) {
    clearTimeout(timeout)
    if (retries > 0 && err.name !== 'AbortError') {
      await new Promise(r => setTimeout(r, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw err
  }
}

export async function fetchStadiumState() {
  const res = await fetchWithRetry(`${BASE}/stadium-state`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function suggestRoute(userLocation, destKey, crowdData, crowdPercentages) {
  const body = { userLocation, destKey }
  if (crowdData) body.crowdData = crowdData
  if (crowdPercentages) body.crowdPercentages = crowdPercentages

  const res = await fetchWithRetry(`${BASE}/suggest-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`)
  return data
}
