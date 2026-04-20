/**
 * frontend/src/hooks/useGeolocation.js
 * ─────────────────────────────────────────────────────────────────
 * Live GPS tracking hook using browser's native Geolocation API.
 *
 * Maps the attendee's real-world coordinates to a stadium grid cell
 * using a configurable bounding box. When the user is inside the
 * stadium perimeter, their position overrides the default server-side
 * userPos and reflects live on the heatmap.
 *
 * STADIUM BOUNDS CONFIG
 * ─────────────────────
 * Default: Jawaharlal Nehru Stadium, New Delhi (used as reference).
 * Change STADIUM_BOUNDS to match the actual venue bounding box.
 * You can get bounds from: https://boundingbox.klokantech.com/
 *
 * For local demo without GPS, the hook returns isSimulated=true
 * with a position derived from the current time — useful for
 * showing judges how the tracking works even in a closed room.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Stadium bounding box (configurable per venue) ─────────────────
// Default: Jawaharlal Nehru Stadium, New Delhi, India
export const STADIUM_BOUNDS = {
  north: 28.5670,   // Top-left latitude
  south: 28.5640,   // Bottom-right latitude
  west:  77.2360,   // Left longitude
  east:  77.2400,   // Right longitude
}

const GRID_SIZE = 5

/**
 * Convert a (lat, lng) coordinate to a 5×5 grid cell index.
 * Returns -1 if the coordinate is outside the stadium bounds.
 */
export function coordToGridIndex(lat, lng, bounds = STADIUM_BOUNDS) {
  // Clamp check — is the point inside the bounding box?
  if (lat > bounds.north || lat < bounds.south ||
      lng < bounds.west  || lng > bounds.east) {
    return -1  // Outside stadium
  }

  const latRange = bounds.north - bounds.south
  const lngRange = bounds.east  - bounds.west

  // Row 0 = north side of stadium, row 4 = south
  const row = Math.min(GRID_SIZE - 1, Math.floor((bounds.north - lat) / latRange * GRID_SIZE))
  const col = Math.min(GRID_SIZE - 1, Math.floor((lng - bounds.west)  / lngRange * GRID_SIZE))

  return row * GRID_SIZE + col
}

/**
 * Generate a simulated GPS position that cycles through the stadium
 * grid over time — useful for demos when indoors / no GPS signal.
 * The position moves every 8 seconds to match the auto-refresh cycle.
 */
function getSimulatedPosition(bounds) {
  const cycle  = Math.floor(Date.now() / 8000)         // changes every 8s
  const path   = [12, 11, 10, 5, 0, 1, 2, 7, 12, 17]  // a walking tour
  const cell   = path[cycle % path.length]

  const row = Math.floor(cell / GRID_SIZE)
  const col = cell % GRID_SIZE

  const latRange = bounds.north - bounds.south
  const lngRange = bounds.east  - bounds.west

  // Center of the grid cell + tiny random jitter
  const lat = bounds.north - (row + 0.5) / GRID_SIZE * latRange + (Math.random() - 0.5) * 0.00002
  const lng = bounds.west  + (col + 0.5) / GRID_SIZE * lngRange + (Math.random() - 0.5) * 0.00002

  return { lat, lng, accuracy: 8 }
}

// ── Hook ──────────────────────────────────────────────────────────
export function useGeolocation({ bounds = STADIUM_BOUNDS, simulateIfUnavailable = true } = {}) {
  const [state, setState] = useState({
    lat:          null,
    lng:          null,
    accuracy:     null,         // metres
    gridIndex:    -1,           // -1 = outside stadium
    isTracking:   false,        // browser GPS active
    isSimulated:  false,        // using demo simulation
    isOutside:    false,        // GPS active but outside bounds
    error:        null,
    loading:      true,
  })

  const watchIdRef  = useRef(null)
  const simTimerRef = useRef(null)

  // Start simulation fallback (cycles every 8s for demo)
  const startSimulation = useCallback(() => {
    const tick = () => {
      const pos       = getSimulatedPosition(bounds)
      const gridIndex = coordToGridIndex(pos.lat, pos.lng, bounds)
      setState(prev => ({
        ...prev,
        lat:         pos.lat,
        lng:         pos.lng,
        accuracy:    pos.accuracy,
        gridIndex,
        isTracking:  false,
        isSimulated: true,
        isOutside:   false,
        loading:     false,
      }))
    }
    tick()
    simTimerRef.current = setInterval(tick, 8000)
  }, [bounds])

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current)
      simTimerRef.current = null
    }
  }, [])

  // Handle a real GPS position update
  const handlePosition = useCallback((position) => {
    stopSimulation()
    const { latitude: lat, longitude: lng, accuracy } = position.coords
    const gridIndex = coordToGridIndex(lat, lng, bounds)

    setState({
      lat,
      lng,
      accuracy: Math.round(accuracy),
      gridIndex,
      isTracking:  true,
      isSimulated: false,
      isOutside:   gridIndex === -1,
      error:       null,
      loading:     false,
    })
  }, [bounds, stopSimulation])

  const handleError = useCallback((err) => {
    console.warn('[GPS]', err.message)
    const errorMessages = {
      1: 'Location access denied — using simulated position',
      2: 'GPS signal unavailable — using simulated position',
      3: 'Location request timed out — using simulated position',
    }
    setState(prev => ({
      ...prev,
      error:      errorMessages[err.code] ?? err.message,
      isTracking: false,
      loading:    false,
    }))
    if (simulateIfUnavailable) startSimulation()
  }, [simulateIfUnavailable, startSimulation])

  // Start GPS tracking on mount, fall back to simulation
  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error:   'Geolocation not supported by this browser',
        loading: false,
      }))
      if (simulateIfUnavailable) startSimulation()
      return
    }

    // Request continuous position updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout:            10000,
        maximumAge:         4000,   // accept cached position up to 4s old
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      stopSimulation()
    }
  }, [handlePosition, handleError, simulateIfUnavailable, startSimulation, stopSimulation])

  return state
}
