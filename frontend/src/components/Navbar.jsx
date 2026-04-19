import { useState, useEffect } from 'react'
import { Map, RefreshCw }      from 'lucide-react'
import { cn }                  from '@/lib/utils'

function LiveClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-xs tabular-nums text-text-sub">
      {t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  )
}

export default function Navbar({ isRefreshing, onRefresh, autoRefresh, onToggleAutoRefresh }) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-5 h-12 border-b border-white/[0.05] bg-card">

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <Map className="w-3 h-3 text-primary" strokeWidth={2} />
        </div>
        <div className="leading-none">
          <div className="text-sm font-semibold text-text-main tracking-tight">SmartFlow</div>
          <div className="text-[9px] font-medium text-text-sub tracking-widest uppercase mt-0.5">
            Stadium Intelligence
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4 text-text-sub">

        {/* LIVE */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">Live</span>
        </div>

        <span className="w-px h-3.5 bg-white/[0.08]" />

        <LiveClock />

        <span className="w-px h-3.5 bg-white/[0.08]" />

        {/* Auto-refresh toggle */}
        <button
          onClick={onToggleAutoRefresh}
          title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          className={cn(
            'flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors duration-150',
            autoRefresh
              ? 'border-primary/20 bg-primary/8 text-primary'
              : 'border-white/[0.06] text-text-sub hover:text-text-main',
          )}
        >
          <RefreshCw className={cn('w-3 h-3', isRefreshing && 'animate-spin')} strokeWidth={2} />
          {autoRefresh ? '8s' : 'Paused'}
        </button>
      </div>
    </header>
  )
}
