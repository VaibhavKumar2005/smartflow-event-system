import { useState } from 'react'
import Navbar        from './components/Navbar'
import KpiStrip      from './components/KpiStrip'
import Heatmap       from './components/Heatmap'
import RoutePlanner  from './components/RoutePlanner'
import AiPanel       from './components/AiPanel'
import AlertsPanel   from './components/AlertsPanel'
import TrendChart    from './components/TrendChart'
import Toast         from './components/Toast'

import { useStadiumState } from './hooks/useStadiumState'
import { suggestRoute }    from './lib/api'

// Fallback labels if backend doesn't supply them
const FALLBACK_LABELS = [
  'Gate A',       'North Stands', 'Main Entry',   'North Stands', 'Gate B',
  'West Wing',    'Food Court',   'Food Court',   'Merch Store',  'East Wing',
  'Section W',    'Concourse W',  'Center Court', 'Concourse E',  'Section E',
  'West Lower',   'Restrooms',    'South Stands', 'First Aid',    'East Lower',
  'Exit W',       'Parking W',    'South Exit',   'Parking E',    'Exit E',
]

export default function App() {
  const state = useStadiumState()

  const [activePath,   setActivePath]   = useState([])
  const [lastRoute,    setLastRoute]    = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [toast,        setToast]        = useState(null)

  const handleSuggestRoute = async (destKey) => {
    if (state.userLocation == null) return
    setRouteLoading(true)
    setLastRoute(null)
    setActivePath([])

    try {
      const data = await suggestRoute(
        state.userLocation,
        destKey,
        state.zones,
        state.crowdPercentages,
      )

      setActivePath(data.path || [])

      setLastRoute({
        destination:     data.destination,
        path:            data.path || [],
        timeSaved:       data.timeSaved       ?? '—',
        riskLevel:       data.riskLevel       ?? 'low',
        confidence:      data.confidence      ?? 'high',
        recommendation:  data.recommendation  ?? '',
        avoidZoneLabels: data.avoidZoneLabels ?? [],
        routeReason:     data.routeReason     ?? '',
      })

      if (data.efficiencyScore != null) {
        state.setKpis(k => ({ ...k, efficiency: data.efficiencyScore }))
      }

      setToast({ message: `Route to ${data.destination?.label} computed.`, type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Routing failed.', type: 'error' })
    } finally {
      setRouteLoading(false)
    }
  }

  const handleClearRoute = () => {
    setActivePath([])
    setLastRoute(null)
    state.setKpis(k => ({ ...k, efficiency: null }))
  }

  if (state.error && !toast?.message) {
    setToast({ message: state.error, type: 'error' })
    state.clearError()
  }

  // ── Initial loading screen ──────────────────────────────────────
  if (state.loading && !state.zones?.length) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-text-sub tracking-wide">Connecting to stadium…</p>
        </div>
      </div>
    )
  }

  const labels = state.zoneLabels && Object.keys(state.zoneLabels).length
    ? state.zoneLabels
    : FALLBACK_LABELS

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main font-sans overflow-hidden">

      <Toast
        message={toast?.message}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />

      {/* ── Navbar ─────────────────────────────────────────── */}
      <Navbar
        isRefreshing={state.isRefreshing}
        lastUpdated={state.lastUpdated}
        autoRefresh={state.autoRefresh}
        onRefresh={state.refreshState}
        onToggleAutoRefresh={state.toggleAutoRefresh}
      />

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-5 py-4 gap-4">

        {/* Row 1: Heatmap (8 cols) + Sidebar (4 cols) */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

          {/* Heatmap */}
          <div className="col-span-8 min-h-0">
            <Heatmap
              zones={state.zones}
              zoneLabels={labels}
              userPos={state.userLocation}
              activePath={activePath}
              lastRoute={lastRoute}
              gridSize={state.gridSize}
              crowdPercentages={state.crowdPercentages}
            />
          </div>

          {/* Sidebar */}
          <div className="col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">
            <RoutePlanner
              destinations={state.destinations}
              zones={state.zones}
              loading={routeLoading}
              lastRoute={lastRoute}
              onSubmit={handleSuggestRoute}
              onClear={handleClearRoute}
            />
            <AiPanel
              lastRoute={lastRoute}
              loading={routeLoading}
            />
            <AlertsPanel alerts={state.alerts} />
          </div>
        </div>

        {/* Row 2: KPI strip + Trend chart */}
        <div className="flex-shrink-0 grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <KpiStrip kpis={state.kpis} />
          </div>
          <div className="col-span-4">
            <TrendChart trendHistory={state.trendHistory} />
          </div>
        </div>

      </div>
    </div>
  )
}
