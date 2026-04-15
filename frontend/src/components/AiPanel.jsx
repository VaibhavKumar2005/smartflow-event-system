import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const RISK_BADGE = {
  low:    'bg-low/10 text-low border-low/20',
  medium: 'bg-medium/10 text-medium border-medium/20',
  high:   'bg-high/10 text-high border-high/20',
}

const CONF_BADGE = {
  high:   'bg-low/10 text-low border-low/20',
  medium: 'bg-medium/10 text-medium border-medium/20',
  low:    'bg-high/10 text-high border-high/20',
}

/** Typewriter that replays whenever `text` changes */
function Typewriter({ text, className }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    if (!text) return

    const tick = () => {
      indexRef.current += 1
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current < text.length) {
        setTimeout(tick, Math.random() * 14 + 8) // 8–22ms jitter = realistic
      }
    }
    const id = setTimeout(tick, 80) // small initial delay feels intentional
    return () => clearTimeout(id)
  }, [text])

  return <p className={className}>{displayed}<span className="animate-pulse">|</span></p>
}

export default function AiPanel({ lastRoute, loading }) {
  const risk = lastRoute?.riskLevel ?? 'low'
  const conf = lastRoute?.confidence ?? 'high'

  return (
    <div className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
            {/* Sparkle */}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">AI Intelligence</span>
        </div>
        {lastRoute && (
          <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', CONF_BADGE[conf])}>
            {conf} conf
          </span>
        )}
      </div>

      <div className="p-3.5">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-surface-300 rounded w-3/4" />
            <div className="h-3 bg-surface-300 rounded w-full" />
            <div className="h-3 bg-surface-300 rounded w-5/6" />
            <div className="h-2 bg-surface-300 rounded w-1/2 mt-3" />
          </div>
        )}

        {/* Idle state */}
        {!loading && !lastRoute && (
          <div className="flex flex-col items-center justify-center py-5 gap-2 text-center">
            <div className="w-8 h-8 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center animate-float">
              <svg className="w-4 h-4 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Select a destination and click <strong className="text-slate-400">Get AI Route</strong> to see live recommendations.
            </p>
          </div>
        )}

        {/* Result */}
        {!loading && lastRoute && (
          <div className="space-y-3">
            {/* Destination + risk */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-accent-400">✦ {lastRoute.destination?.label}</span>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', RISK_BADGE[risk])}>
                {risk} risk
              </span>
            </div>

            {/* AI recommendation with typewriter */}
            <Typewriter
              text={lastRoute.recommendation ?? ''}
              className="text-[12px] text-slate-300 leading-relaxed"
            />

            {/* Metadata rows */}
            <div className="space-y-1.5 pt-1">
              <InfoRow icon="route" label="To" value={lastRoute.destination?.label} color="text-accent-400" />
              <InfoRow icon="clock" label="Saved" value={lastRoute.timeSaved} color="text-cyan-400" />
              <InfoRow icon="map-pin" label="Zones" value={`${lastRoute.path?.length ?? 0} zones`} color="text-brand-400" />
              {lastRoute.routeReason && (
                <InfoRow icon="info" label="Why" value={lastRoute.routeReason} color="text-slate-500" />
              )}
            </div>

            {/* Avoid tags */}
            {lastRoute.avoidZoneLabels?.length > 0 && (
              <div className="pt-1 border-t border-border">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">⚠ Avoid</p>
                <div className="flex flex-wrap gap-1">
                  {lastRoute.avoidZoneLabels.map(z => (
                    <span key={z} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-high/10 text-red-400 border border-high/20">
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, color }) {
  const icons = {
    route:   <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />,
    clock:   <><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></>,
    'map-pin': <><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>,
    info:    <><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" /></>,
  }

  return (
    <div className="flex gap-1.5 items-start text-[11px]">
      <svg className={cn('w-3 h-3 flex-shrink-0 mt-0.5', color)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icons[icon]}
      </svg>
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-300 font-medium leading-tight">{value}</span>
    </div>
  )
}
