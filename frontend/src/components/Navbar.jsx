import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { RefreshCw, Clock, Map } from 'lucide-react'

/** Live clock — updates every second */
function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-xs tabular-nums text-slate-400 font-medium">
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
    </span>
  )
}

/** Relative timestamp — "3s ago", "1m ago" */
function RelativeTime({ timestamp }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!timestamp) return null
  const diff = Math.floor((now - new Date(timestamp).getTime()) / 1000)
  const label = diff < 5 ? 'just now' : diff < 60 ? `${diff}s ago` : `${Math.floor(diff / 60)}m ago`

  return <span className="text-[10px] text-slate-500 font-medium">{label}</span>
}

export default function Navbar({ loadingState, onRefresh, lastUpdated, autoRefresh, onToggleAutoRefresh }) {
  return (
    <header className="relative glass-strong flex items-center justify-between px-5 h-12 flex-shrink-0 z-10">

      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand flex-shrink-0">
          <Map className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <div className="leading-none">
          <div className="text-sm font-bold tracking-tight text-white">SmartFlow</div>
          <div className="text-[9px] font-semibold tracking-widest uppercase text-slate-500">Crowd Intelligence</div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* LIVE pill with ping animation */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-widest uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
          </span>
          Live
        </div>

        <RelativeTime timestamp={lastUpdated} />
        <LiveClock />

        {/* Auto-refresh toggle */}
        <button
          onClick={onToggleAutoRefresh}
          title={autoRefresh ? 'Auto-refresh ON (8s)' : 'Auto-refresh OFF'}
          className={cn(
            'w-7 h-7 rounded-lg border flex items-center justify-center transition-all',
            autoRefresh
              ? 'border-brand-500/30 text-brand-400 bg-brand-500/10 hover:bg-brand-500/20'
              : 'border-border text-slate-500 hover:text-slate-300 hover:border-border-strong'
          )}
        >
          <Clock className="w-3.5 h-3.5" strokeWidth={2} />
        </button>

        {/* Manual refresh */}
        <button
          onClick={onRefresh}
          disabled={loadingState}
          title="Refresh stadium state"
          className={cn(
            'w-7 h-7 rounded-lg border border-border flex items-center justify-center text-slate-400 transition-all hover:text-white hover:border-border-strong hover:bg-surface-300',
            loadingState && 'animate-spin opacity-60 cursor-wait',
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  )
}
