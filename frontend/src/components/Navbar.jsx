import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

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

export default function Navbar({ loadingState, onRefresh }) {
  return (
    <header className="glass-strong flex items-center justify-between px-5 h-12 flex-shrink-0 z-10 border-b border-border">

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-content shadow-brand flex-shrink-0">
          <svg className="w-4 h-4 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div className="leading-none">
          <div className="text-sm font-bold tracking-tight text-white">SmartFlow</div>
          <div className="text-[9px] font-semibold tracking-widest uppercase text-slate-500">Crowd Intelligence</div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* LIVE pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          Live
        </div>
        <LiveClock />
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loadingState}
          title="Refresh stadium state"
          className={cn(
            'w-7 h-7 rounded-lg border border-border flex items-center justify-center text-slate-400 transition-all hover:text-white hover:border-border-strong hover:bg-surface-300',
            loadingState && 'animate-spin opacity-60 cursor-wait',
          )}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </header>
  )
}
