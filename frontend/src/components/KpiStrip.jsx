import { useEffect, useRef, useState } from 'react'
import { Users, Clock, ShieldCheck, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Count-up animation ───────────────────────────────────────────
function CountUp({ value, duration = 500 }) {
  const [current, setCurrent] = useState(value)
  const prev = useRef(value)
  const raf  = useRef(null)

  useEffect(() => {
    const from = prev.current
    const to   = typeof value === 'number' ? value : 0
    if (from === to) { setCurrent(to); return }

    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const pct   = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - pct, 3)
      setCurrent(Math.round(from + (to - from) * eased))
      if (pct < 1) raf.current = requestAnimationFrame(step)
      else prev.current = to
    }
    raf.current = requestAnimationFrame(step)
    return () => { if (raf.current) cancelAnimationFrame(raf.current); prev.current = to }
  }, [value, duration])

  return current
}

// ── Trend arrow ──────────────────────────────────────────────────
function Arrow({ curr, prev }) {
  if (prev == null) return null
  const dir = curr > prev ? 'up' : curr < prev ? 'down' : null
  if (!dir) return null
  return (
    <span className={cn('text-xs ml-1', dir === 'up' ? 'text-danger' : 'text-success')}>
      {dir === 'up' ? '↑' : '↓'}
    </span>
  )
}

// ── Card config — 4th card is now Venue Capacity ─────────────────
const CARDS = [
  {
    key:      'density',
    label:    'Crowd Level',
    icon:     Users,
    getValue: k => k.densityScore,
    getSuffix:()  => '%',
    getPrev:  k => k.prevDensityScore,
    getSub:   k => k.densityLabel,
    getColor: k => k.densityScore > 60 ? 'text-danger' : k.densityScore > 30 ? 'text-warning' : 'text-success',
    iconColor:'text-primary',
  },
  {
    key:      'wait',
    label:    'Avg Wait Time',
    icon:     Clock,
    getValue: k => k.avgWait,
    getSuffix:()  => ' min',
    getPrev:  k => k.prevAvgWait,
    getSub:   k => k.avgWait > 7 ? 'Elevated' : k.avgWait > 3 ? 'Moderate' : 'Low',
    getColor: k => k.avgWait > 7 ? 'text-danger' : k.avgWait > 3 ? 'text-warning' : 'text-success',
    iconColor:'text-accent',
  },
  {
    key:      'safe',
    label:    'Safe Zones',
    icon:     ShieldCheck,
    getValue: k => k.safeZones,
    getSuffix:k  => ` / ${k.totalZones}`,
    getPrev:  k => k.prevSafeZones,
    getSub:   k => k.safeZones >= 12 ? 'Favorable' : k.safeZones >= 6 ? 'Moderate' : 'Limited',
    getColor: k => k.safeZones >= 12 ? 'text-success' : k.safeZones >= 6 ? 'text-warning' : 'text-danger',
    iconColor:'text-success',
  },
  {
    // Venue Capacity — replaces Route Efficiency (which is always empty until a route is run)
    key:      'capacity',
    label:    'Venue Capacity',
    icon:     Activity,
    getValue: k => k.venueCapacity ?? 0,
    getSuffix:()  => '%',
    getPrev:  k => k.prevVenueCapacity,
    getSub:   k => {
      const v = k.venueCapacity ?? 0
      return v > 80 ? 'Near capacity' : v > 60 ? 'High occupancy' : v > 40 ? 'Moderate' : 'Low occupancy'
    },
    getColor: k => {
      const v = k.venueCapacity ?? 0
      return v > 80 ? 'text-danger' : v > 60 ? 'text-warning' : 'text-success'
    },
    iconColor:'text-warning',
  },
]

// ── Component ────────────────────────────────────────────────────
export default function KpiStrip({ kpis }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {CARDS.map(card => {
        const Icon = card.icon
        const val  = card.getValue(kpis)
        const prev = card.getPrev(kpis)

        return (
          <div
            key={card.key}
            className="bg-card rounded-2xl border border-white/[0.06] shadow-card px-5 py-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn('w-3.5 h-3.5', card.iconColor)} strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                {card.label}
              </span>
            </div>

            <div className="flex items-baseline gap-0.5">
              <span className={cn('text-2xl font-bold tabular-nums leading-none', card.getColor(kpis))}>
                <CountUp value={val} />
              </span>
              <span className="text-xs text-muted ml-0.5">
                {card.getSuffix(kpis)}
              </span>
              <Arrow curr={val} prev={prev} />
            </div>

            <p className="text-[11px] text-muted mt-1">{card.getSub(kpis)}</p>
          </div>
        )
      })}
    </div>
  )
}
