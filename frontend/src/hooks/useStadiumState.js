import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchStadiumState } from '../lib/api'

// ── Phase display config (used by Navbar badge) ──────────────────
export const PHASE_CONFIG = {
  PRE_GAME:  { label: 'Pre-Game',  color: 'text-warning  bg-warning/10  border-warning/25'  },
  IN_GAME_1: { label: 'In-Game',   color: 'text-success  bg-success/10  border-success/25'  },
  HALFTIME:  { label: 'Halftime',  color: 'text-primary  bg-primary/10  border-primary/25'  },
  IN_GAME_2: { label: 'In-Game',   color: 'text-success  bg-success/10  border-success/25'  },
  POST_GAME: { label: 'Post-Game', color: 'text-danger   bg-danger/10   border-danger/25'   },
}

export function useStadiumState() {
  const [data, setData] = useState({
    zones:            [],
    zoneLabels:       {},
    crowdPercentages: [],
    destinations:     [],
    gridSize:         5,
    userLocation:     0,
    eventPhase:       'IN_GAME_1',
    eventPhaseLabel:  'In-Game',
    venueCapacity:    0,
  })

  const [loading,      setLoading]      = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error,        setError]        = useState(null)

  const [kpis, setKpis] = useState({
    densityScore:     0,
    prevDensityScore: null,
    avgWait:          0,
    prevAvgWait:      null,
    safeZones:        25,
    prevSafeZones:    null,
    totalZones:       25,
    venueCapacity:    0,
    prevVenueCapacity:null,
    efficiency:       null,
    densityLabel:     'Smooth',
  })

  const [alerts,       setAlerts]       = useState([])
  const [trendHistory, setTrendHistory] = useState([])
  const [lastUpdated,  setLastUpdated]  = useState(null)
  const [autoRefresh,  setAutoRefresh]  = useState(true)

  // Refs for surge detection (compare current vs previous percentages)
  const prevPercentagesRef = useRef([])
  const _kpiRef            = useRef(kpis)

  const fetchState = useCallback(async (isAuto = false) => {
    try {
      if (!isAuto && data.zones.length === 0) setLoading(true)
      setIsRefreshing(true)

      const res = await fetchStadiumState()
      const {
        zones, crowdPercentages,
        timestamp, destinations, gridSize,
        userPos, zoneLabels,
        eventPhase, eventPhaseLabel, venueCapacity,
      } = res

      setData({
        zones:            zones            || [],
        crowdPercentages: crowdPercentages || [],
        destinations:     destinations     || [],
        gridSize:         gridSize         || 5,
        userLocation:     userPos          ?? 0,
        zoneLabels:       zoneLabels       || {},
        eventPhase:       eventPhase       || 'IN_GAME_1',
        eventPhaseLabel:  eventPhaseLabel  || 'In-Game',
        venueCapacity:    venueCapacity    ?? 0,
      })

      setLastUpdated(timestamp || new Date().toISOString())

      // ── KPI calculation ─────────────────────────────────────────
      let high = 0, med = 0, low = 0
      let totalDensity = 0
      const zArray = zones            || []
      const cArray = crowdPercentages || []

      zArray.forEach((z, i) => {
        const pct = cArray[i] || 0
        if      (z === 'high')   { high++; totalDensity += 70 + pct * 0.3 }
        else if (z === 'medium') { med++;  totalDensity += 35 + pct * 0.3 }
        else                     { low++;  totalDensity += 8  + pct * 0.2 }
      })

      const totalZones   = zArray.length || 25
      const densityScore = Math.round(totalDensity / totalZones) || 0
      const avgWait      = Math.round((high * 6 + med * 2.5 + low * 0.5) / totalZones * 10) / 10 || 0
      const safeZones    = low

      setKpis(prev => {
        _kpiRef.current = {
          ...prev,
          prevDensityScore:  prev.densityScore,
          densityScore,
          prevAvgWait:       prev.avgWait,
          avgWait,
          prevSafeZones:     prev.safeZones,
          safeZones,
          totalZones,
          prevVenueCapacity: prev.venueCapacity,
          venueCapacity:     venueCapacity ?? prev.venueCapacity,
          densityLabel: densityScore > 65 ? 'Severe' : densityScore > 35 ? 'Moderate' : 'Smooth',
          // efficiency is set separately when a route is computed — don't overwrite
          efficiency: prev.efficiency,
        }
        return _kpiRef.current
      })

      // ── Surge detection ─────────────────────────────────────────
      // Compare current percentages with previous snapshot.
      // A zone that jumped +25pp in one 8-second refresh is a surge.
      const surgeZones = []
      const prev       = prevPercentagesRef.current
      if (prev.length === cArray.length) {
        cArray.forEach((pct, i) => {
          const delta = pct - (prev[i] ?? pct)
          if (delta >= 25) surgeZones.push(i)
        })
      }
      prevPercentagesRef.current = [...cArray]

      // ── Phase-aware alert generation ────────────────────────────
      const now       = new Date()
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const newAlerts = []

      // Phase-specific operational alerts
      if (eventPhase === 'HALFTIME') {
        newAlerts.push({ id: 'phase-halftime', severity: 'high',
          text: 'Halftime: Food Court and Restrooms at peak load', time: timeLabel })
      }
      if (eventPhase === 'POST_GAME') {
        newAlerts.push({ id: 'phase-postgame', severity: 'high',
          text: 'Post-game: All exits and parking surging simultaneously', time: timeLabel })
      }
      if (eventPhase === 'PRE_GAME') {
        newAlerts.push({ id: 'phase-pregame', severity: 'medium',
          text: 'Pre-game: Gate and entry congestion building', time: timeLabel })
      }

      // Surge alerts (zone-specific, highest priority)
      surgeZones.slice(0, 2).forEach(i => {
        const label = zoneLabels?.[i] ?? `Zone ${i}`
        newAlerts.push({ id: `surge-${i}`, severity: 'high',
          text: `Rapid surge detected: ${label}`, time: timeLabel })
      })

      // General density alerts
      if (high > 5) {
        newAlerts.push({ id: 'high-zones', severity: 'high',
          text: `Severe congestion in ${high} zones — re-routing recommended`, time: timeLabel })
      } else if (high > 2) {
        newAlerts.push({ id: 'med-zones', severity: 'medium',
          text: `${high} high-density zones active — monitor concourses`, time: timeLabel })
      }

      if (avgWait > 6) {
        newAlerts.push({ id: 'wait-time', severity: 'medium',
          text: `Est. wait times elevated — avg ${avgWait} min`, time: timeLabel })
      }

      if ((venueCapacity ?? 0) > 75) {
        newAlerts.push({ id: 'capacity', severity: 'medium',
          text: `Venue at ${venueCapacity}% capacity — expect bottlenecks`, time: timeLabel })
      }

      // Fallback: all clear
      if (newAlerts.length === 0) {
        newAlerts.push({ id: 'sys-ok', severity: 'info',
          text: 'All zones operating normally', time: timeLabel })
      }

      // Always append connection status at the bottom
      newAlerts.push({ id: 'conn', severity: 'info',
        text: `Live data stream active · ${eventPhaseLabel}`, time: timeLabel })

      setAlerts(newAlerts)

      // ── Trend history (zone counts per phase) ───────────────────
      setTrendHistory(prev => {
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const pt      = { label: timeStr, High: high, Medium: med, Low: low }
        const next    = [...prev, pt]
        if (next.length > 20) next.shift()
        return next
      })

      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to fetch stadium state')
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }, [data.zones.length])

  // Initial fetch
  useEffect(() => {
    fetchState(false)
  }, [fetchState])

  // 8-second auto-refresh loop
  useEffect(() => {
    let timer
    if (autoRefresh) {
      timer = setInterval(() => fetchState(true), 8000)
    }
    return () => clearInterval(timer)
  }, [autoRefresh, fetchState])

  const toggleAutoRefresh = () => setAutoRefresh(a => !a)
  const clearError        = () => setError(null)

  return {
    ...data,
    loading,
    isRefreshing,
    error,
    clearError,
    kpis,
    setKpis,
    alerts,
    trendHistory,
    lastUpdated,
    autoRefresh,
    toggleAutoRefresh,
    refreshState: () => fetchState(false),
  }
}
