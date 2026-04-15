import { useState, useCallback } from 'react'
import { fetchStadiumState, suggestRoute } from '@/lib/api'

const FALLBACK_STATE = {
  zones: [
    'low','medium','high','medium','low',
    'low','high','high','medium','low',
    'low','medium','low','high','medium',
    'medium','low','medium','low','low',
    'high','medium','low','medium','low',
  ],
  zoneLabels: [
    'Gate A','North Stands','Main Entry','North Stands','Gate B',
    'West Wing','Food Court','Food Court','Merch Store','East Wing',
    'Section W','Concourse W','Center Court','Concourse E','Section E',
    'West Lower','Restrooms','South Stands','First Aid','East Lower',
    'Exit W','Parking W','South Exit','Parking E','Exit E',
  ],
  destinations: [
    { key: 'food',     label: 'Food Court',        gridIndex: 6  },
    { key: 'exit',     label: 'Main Entry',         gridIndex: 2  },
    { key: 'restroom', label: 'Restrooms',          gridIndex: 16 },
    { key: 'merch',    label: 'Merchandise Store',  gridIndex: 8  },
    { key: 'south',    label: 'South Exit',         gridIndex: 22 },
  ],
  userPos: 12,
  gridSize: 5,
}

function buildAlerts(zones, zoneLabels) {
  const alerts = []
  zones.forEach((z, i) => {
    if (z === 'high') {
      alerts.push({
        id: `high-${i}`,
        severity: 'high',
        text: `High congestion: ${zoneLabels[i] ?? `Zone ${i}`}`,
        time: `${Math.floor(Math.random() * 5) + 1}m ago`,
      })
    }
  })
  const med = zones.filter(z => z === 'medium').length
  if (med > 4) alerts.push({ id: 'med-spike', severity: 'medium', text: `${med} zones at moderate capacity`, time: 'Just now' })
  alerts.push({ id: 'ai-ok', severity: 'info', text: 'AI routing engine active', time: 'System' })
  return alerts
}

export function useStadiumState() {
  const [state, setState] = useState({
    ...FALLBACK_STATE,
    activePath: [],
    lastRoute: null,
    alerts: buildAlerts(FALLBACK_STATE.zones, FALLBACK_STATE.zoneLabels),
    loadingState: false,   // fetching stadium state
    loadingRoute: false,   // fetching route
    error: null,
  })

  const reload = useCallback(async () => {
    setState(s => ({ ...s, loadingState: true, error: null }))
    try {
      const data = await fetchStadiumState()
      setState(s => ({
        ...s,
        zones:        data.zones        ?? FALLBACK_STATE.zones,
        zoneLabels:   data.zoneLabels   ?? FALLBACK_STATE.zoneLabels,
        destinations: data.destinations ?? FALLBACK_STATE.destinations,
        userPos:      data.userPos      ?? FALLBACK_STATE.userPos,
        gridSize:     data.gridSize     ?? FALLBACK_STATE.gridSize,
        activePath:   [],
        lastRoute:    null,
        alerts: buildAlerts(data.zones ?? FALLBACK_STATE.zones, data.zoneLabels ?? FALLBACK_STATE.zoneLabels),
        loadingState: false,
        error: null,
      }))
    } catch (e) {
      // Graceful: keep fallback data, show banner error
      setState(s => ({ ...s, loadingState: false, error: e.message }))
    }
  }, [])

  const getRoute = useCallback(async (destKey) => {
    setState(s => ({ ...s, loadingRoute: true, activePath: [], lastRoute: null, error: null }))
    try {
      const data = await suggestRoute(state.userPos, destKey)
      setState(s => ({
        ...s,
        activePath:  data.path ?? [],
        lastRoute:   data,
        loadingRoute: false,
        alerts: [
          { id: `route-${Date.now()}`, severity: 'info', text: `Route to ${data.destination?.label ?? '?'} — ${data.path?.length ?? 0} zones`, time: 'Just now' },
          ...s.alerts,
        ].slice(0, 10),
      }))
    } catch (e) {
      setState(s => ({ ...s, loadingRoute: false, error: e.message }))
    }
  }, [state.userPos])

  const clearRoute = useCallback(() => {
    setState(s => ({ ...s, activePath: [], lastRoute: null }))
  }, [])

  // Derived KPIs
  const kpis = computeKPIs(state)

  return { ...state, reload, getRoute, clearRoute, kpis }
}

function computeKPIs(state) {
  const { zones, lastRoute, userPos } = state
  const total   = zones.length
  const lo = zones.filter(z => z === 'low').length
  const md = zones.filter(z => z === 'medium').length
  const hi = zones.filter(z => z === 'high').length

  const densityScore = Math.round(((md * 0.5 + hi) / total) * 100)
  const densityLabel = densityScore > 60 ? 'High' : densityScore > 30 ? 'Medium' : 'Low'
  const avgWait = Math.round(2 + (densityScore / 100) * 8)

  let efficiency = null
  if (lastRoute) {
    const pathLen = lastRoute.path?.length ?? 1
    const s = state.gridSize
    const destIdx = lastRoute.destination?.gridIndex ?? 0
    const dx = Math.abs((userPos % s) - (destIdx % s))
    const dy = Math.abs(Math.floor(userPos / s) - Math.floor(destIdx / s))
    const direct = dx + dy + 1
    efficiency = Math.max(0, Math.round(Math.min(100, (direct / pathLen) * 100)) - 60)
  }

  return {
    densityLabel, densityScore,
    avgWait,
    safeZones: lo, totalZones: total,
    efficiency, hi, md, lo,
  }
}
