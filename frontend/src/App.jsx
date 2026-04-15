import { useEffect } from 'react'
import { useStadiumState } from '@/hooks/useStadiumState'
import Navbar        from '@/components/Navbar'
import KpiStrip      from '@/components/KpiStrip'
import Heatmap       from '@/components/Heatmap'
import RoutePlanner  from '@/components/RoutePlanner'
import AiPanel       from '@/components/AiPanel'
import AlertsPanel   from '@/components/AlertsPanel'
import TrendChart    from '@/components/TrendChart'

export default function App() {
  const stadium = useStadiumState()

  useEffect(() => { stadium.reload() }, []) // eslint-disable-line

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-surface-500 text-slate-200 font-sans select-none">

      {/* ── Ambient background blobs ── */}
      <div className="ambient-blob w-[520px] h-[520px] bg-brand-600/10 -top-40 -left-32" />
      <div className="ambient-blob w-[420px] h-[420px] bg-accent-500/8 bottom-0 right-0" />

      {/* ── Nav ── */}
      <Navbar loadingState={stadium.loadingState} onRefresh={stadium.reload} />

      {/* ── KPI strip ── */}
      <KpiStrip kpis={stadium.kpis} />

      {/* ── Main content ── */}
      <div className="flex flex-1 min-h-0 gap-2.5 px-5 pb-2">

        {/* Left 65% — heatmap + trend chart */}
        <div className="flex flex-col flex-[65] min-w-0 gap-2.5">
          <Heatmap
            zones={stadium.zones}
            zoneLabels={stadium.zoneLabels}
            userPos={stadium.userPos}
            activePath={stadium.activePath}
            lastRoute={stadium.lastRoute}
            gridSize={stadium.gridSize}
          />
          <TrendChart zones={stadium.zones} />
        </div>

        {/* Right 35% — controls */}
        <div className="flex flex-col flex-[35] min-w-[260px] max-w-[340px] gap-2.5 overflow-y-auto pb-1">
          <RoutePlanner
            destinations={stadium.destinations}
            loading={stadium.loadingRoute}
            lastRoute={stadium.lastRoute}
            onSubmit={stadium.getRoute}
            onClear={stadium.clearRoute}
          />
          <AiPanel
            lastRoute={stadium.lastRoute}
            loading={stadium.loadingRoute}
          />
          <AlertsPanel alerts={stadium.alerts} />
        </div>
      </div>
    </div>
  )
}
