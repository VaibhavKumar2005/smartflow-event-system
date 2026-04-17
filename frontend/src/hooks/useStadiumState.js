import { useState, useCallback, useEffect, useRef } from 'react'
import { fetchStadiumState } from '../lib/api'

export function useStadiumState() {
  const [data, setData] = useState({
    zones: [],
    zoneLabels: {},
    crowdPercentages: [],
    destinations: [],
    gridSize: 5,
    userLocation: 0,
  })
  
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  
  const [kpis, setKpis] = useState({
    densityScore: 0,
    prevDensityScore: null,
    avgWait: 0,
    prevAvgWait: null,
    safeZones: 25,
    prevSafeZones: null,
    totalZones: 25,
    efficiency: null,
    densityLabel: 'Low',
  })

  const [alerts, setAlerts] = useState([])
  const [trendHistory, setTrendHistory] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const _kpiRef = useRef(kpis)

  const fetchState = useCallback(async (isAuto = false) => {
    try {
      if (!isAuto && data.zones.length === 0) setLoading(true)
      setIsRefreshing(true)
      
      const res = await fetchStadiumState()
      const { zones, crowdPercentages, lastUpdated: serverTime, destinations, gridSize, userLocation, zoneLabels } = res
      
      setData({
        zones: zones || [],
        crowdPercentages: crowdPercentages || [],
        destinations: destinations || [],
        gridSize: gridSize || 5,
        userLocation: userLocation !== undefined ? userLocation : 0,
        zoneLabels: zoneLabels || {}
      })

      setLastUpdated(serverTime || new Date().toISOString())

      // Calc KPIs
      let high = 0, med = 0, low = 0;
      let totalDensity = 0;
      const zArray = zones || []
      const cArray = crowdPercentages || []

      zArray.forEach((z, i) => {
        const pct = cArray[i] || 0
        if (z === 'high') { high++; totalDensity += 80 + pct * 0.2 }
        else if (z === 'medium') { med++; totalDensity += 40 + pct * 0.2 }
        else { low++; totalDensity += 10 + pct * 0.2 }
      })

      const totalZones = zArray.length || 25
      const densityScore = Math.round(totalDensity / totalZones) || 0
      const avgWait = Math.round((high * 5 + med * 2 + low * 0.5) / totalZones * 10) / 10 || 0
      const safeZones = low

      setKpis(prev => {
        _kpiRef.current = {
          ...prev,
          prevDensityScore: prev.densityScore,
          densityScore,
          prevAvgWait: prev.avgWait,
          avgWait,
          prevSafeZones: prev.safeZones,
          safeZones,
          totalZones,
          densityLabel: densityScore > 65 ? 'Severe' : densityScore > 35 ? 'Moderate' : 'Smooth',
        }
        return _kpiRef.current
      })

      // Alerts
      const newAlerts = []
      if (high > 3) newAlerts.push({ id: 'high-zones', severity: 'high', text: `Severe congestion in ${high} zones`, time: 'Just now' })
      if (avgWait > 5) newAlerts.push({ id: 'wait-time', severity: 'medium', text: `Elevated wait times across stadium`, time: 'Just now' })
      
      if (newAlerts.length === 0) {
        newAlerts.push({ id: 'sys-ok', severity: 'info', text: 'All systems online and responsive', time: 'Just now' })
      } else {
        newAlerts.push({ id: 'sys-ok', severity: 'info', text: 'Backend live stream connected', time: 'Just now' })
      }
      setAlerts(newAlerts)

      // Trend history (max 20 points)
      setTrendHistory(prev => {
        const now = new Date()
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const pt = { label: timeStr, High: high, Medium: med, Low: low }
        const next = [...prev, pt]
        if (next.length > 20) next.shift() // Keep only last 20 measurements
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

  // Simulation interval for 8-second refresh loop
  useEffect(() => {
    let timer
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchState(true)
      }, 8000)
    }
    return () => clearInterval(timer)
  }, [autoRefresh, fetchState])

  const toggleAutoRefresh = () => setAutoRefresh(a => !a)
  const clearError = () => setError(null)

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
