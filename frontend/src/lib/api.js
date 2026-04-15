const BASE = '/api'

export async function fetchStadiumState() {
  const res = await fetch(`${BASE}/stadium-state`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function suggestRoute(userLocation, destKey) {
  const res = await fetch(`${BASE}/suggest-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userLocation, destKey }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`)
  return data
}
