import { useState, useEffect } from 'react'
import { Map, RefreshCw, Navigation } from 'lucide-react'
import { cn }                  from '@/lib/utils'
import { PHASE_CONFIG }        from '@/hooks/useStadiumState'

function LiveClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-[12px] tabular-nums text-muted font-medium">
      {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  )
}

export default function Navbar({ isRefreshing, autoRefresh, onToggleAutoRefresh, eventPhase, eventPhaseLabel, gps }) {
  const phase = PHASE_CONFIG[eventPhase] ?? PHASE_CONFIG.IN_GAME_1

  // GPS status label + color
  const gpsStatus = gps?.isTracking
    ? { label: `GPS ±${gps.accuracy}m`, dot: 'bg-success', text: 'text-success' }
    : gps?.isSimulated
    ? { label: 'GPS Sim',               dot: 'bg-warning', text: 'text-warning' }
    : { label: 'No GPS',                dot: 'bg-muted',   text: 'text-muted'   }

  return (
    <header className="flex-shrink-0 flex items-center justify-between px-6 h-14 bg-card border-b border-white/[0.06]">

      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
          <Map className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        </div>
        <div className="leading-none">
          <div className="text-sm font-bold text-slate-100 tracking-tight">SmartFlow</div>
          <div className="text-[9px] font-medium text-muted tracking-widest uppercase mt-0.5">Stadium Intelligence</div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">

        {/* Event Phase badge */}
        {eventPhase && (
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold uppercase tracking-wider',
            phase.color,
          )}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            {eventPhaseLabel || phase.label}
          </div>
        )}

        <div className="w-px h-4 bg-white/10" />

        {/* GPS indicator */}
        <div className="flex items-center gap-1.5">
          <Navigation className={cn('w-3 h-3', gpsStatus.text)} strokeWidth={2} />
          <span className={cn('text-[11px] font-medium', gpsStatus.text)}>{gpsStatus.label}</span>
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', gpsStatus.dot)} />
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[11px] font-semibold text-success tracking-wide">Live</span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <LiveClock />

        <div className="w-px h-4 bg-white/10" />

        {/* Auto-refresh toggle */}
        <button
          onClick={onToggleAutoRefresh}
          title={autoRefresh ? 'Auto-refresh ON — click to pause' : 'Auto-refresh OFF'}
          className={cn(
            'flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors duration-150',
            autoRefresh
              ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
              : 'border-white/10 bg-transparent text-muted hover:text-slate-300',
          )}
        >
          <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} strokeWidth={2} />
          {autoRefresh ? '8s' : 'Paused'}
        </button>
      </div>
    </header>
  )
}
