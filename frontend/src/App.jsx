import { useState } from 'react'
import Navbar from './components/Navbar'
import KpiStrip from './components/KpiStrip'
import Heatmap from './components/Heatmap'
import RoutePlanner from './components/RoutePlanner'
import AiPanel from './components/AiPanel'
import AlertsPanel from './components/AlertsPanel'
import TrendChart from './components/TrendChart'
import Toast from './components/Toast'

import { useStadiumState } from './hooks/useStadiumState'
import { suggestRoute } from './lib/api'

// Fallback labels if backend doesn't supply them
const FALLBACK_LABELS = [
  'Main North', 'North Conc.', 'Food N', 'Merch N', 'VIP North',
  'Gate A', 'Sec 101', 'Sec 102', 'Sec 103', 'Gate B',
  'West Conc.', 'Sec 104', 'Center', 'Sec 105', 'East Conc.',
  'Gate C', 'Sec 106', 'Sec 107', 'Sec 108', 'Gate D',
  'VIP South', 'Food S', 'Merch S', 'South Conc.', 'Main South'
]

export default function App() {
  const state = useStadiumState()
  
  const [activePath, setActivePath] = useState([])
  const [lastRoute, setLastRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSuggestRoute = async (destKey) => {
    if (!state.userLocation && state.userLocation !== 0) return
    setRouteLoading(true)
    setLastRoute(null)
    setActivePath([])
    try {
      const data = await suggestRoute(state.userLocation, destKey, state.zones, state.crowdPercentages)
      
      setActivePath(data.path || [])
      setLastRoute({
        destination: data.destination,
        timeSaved: data.insights?.timeSaved || '2-4 mins',
        riskLevel: data.insights?.riskLevel || 'low',
        confidence: 'high',
        recommendation: data.explanation,
        avoidZoneLabels: data.insights?.avoidZoneLabels || [],
        routeReason: data.insights?.routeReason,
      })
      
      if (data.insights?.efficiencyScore) {
        state.setKpis(k => ({ ...k, efficiency: data.insights.efficiencyScore }))
      }
      
      setToast({ message: `Route to ${data.destination.label} optimized securely.`, type: 'success' })
    } catch (err) {
      setToast({ message: err.message || 'Routing calculation failed.', type: 'error' })
    } finally {
      setRouteLoading(false)
    }
  }

  const handleClearRoute = () => {
    setActivePath([])
    setLastRoute(null)
    state.setKpis(k => ({ ...k, efficiency: null }))
  }

  // Global error reporting
  if (state.error && !toast?.message) {
    setToast({ message: state.error, type: 'error' })
    state.clearError()
  }

  // Shimmer loading initial state
  if (state.loading && !state.zones?.length) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-400 text-sm font-bold tracking-widest uppercase animate-pulse">Initializing Interface…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background text-white font-sans overflow-hidden">
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />

      <Navbar
        loadingState={state.isRefreshing}
        onRefresh={state.refreshState}
        lastUpdated={state.lastUpdated}
        autoRefresh={state.autoRefresh}
        onToggleAutoRefresh={state.toggleAutoRefresh}
      />

      <KpiStrip kpis={state.kpis} />

      <main className="flex-1 flex gap-4 p-4 min-h-0 container mx-auto max-w-7xl">
        {/* Left Column: Map (60%) */}
        <div className="w-[60%] flex flex-col min-h-0">
          <Heatmap
            zones={state.zones}
            zoneLabels={state.zoneLabels && Object.keys(state.zoneLabels).length ? state.zoneLabels : FALLBACK_LABELS}
            userPos={state.userLocation}
            activePath={activePath}
            lastRoute={lastRoute}
            gridSize={state.gridSize}
            crowdPercentages={state.crowdPercentages}
          />
        </div>

        {/* Right Column: AI & Operations (40%) */}
        <div className="w-[40%] flex flex-col gap-4 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-surface-300 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
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

          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            <TrendChart trendHistory={state.trendHistory} />
            <AlertsPanel alerts={state.alerts} />
          </div>
        </div>
      </main>

      {/* Decorative Operations Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-[0.2]" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px]" />
      </div>
    </div>
  )
}
