import { useEffect, useRef, useState } from 'react'
import { Users, Clock, ShieldCheck, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

function CountUp({ value, duration = 400 }) {
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

function Arrow({ curr, prev }) {
  if (prev == null) return null
  const dir = curr > prev ? 'up' : curr < prev ? 'down' : null
  if (!dir) return null
  return (
    <span className={cn('text-[10px] ml-0.5', dir === 'up' ? 'text-danger' : 'text-success')}>
      {dir === 'up' ? '↑' : '↓'}
    </span>
  )
}

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
    getSub:   k => k.avgWait > 7 ? 'Elevated' : 'Acceptable',
    getColor: ()  => 'text-text-main',
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
    key:      'efficiency',
    label:    'Route Efficiency',
    icon:     Zap,
    getValue: k => k.efficiency ?? 0,
    getSuffix:()  => '%',
    getPrev:  ()  => null,
    getSub:   k => k.efficiency != null ? 'vs direct path' : 'No route yet',
    getColor: k => k.efficiency == null ? 'text-text-sub' : k.efficiency >= 20 ? 'text-success' : 'text-warning',
    iconColor:'text-warning',
  },
]

export default function KpiStrip({ kpis }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {CARDS.map(card => {
        const Icon = card.icon
        const val  = card.getValue(kpis)
        const prev = card.getPrev(kpis)

        return (
          <div
            key={card.key}
            className="bg-surface rounded-2xl border border-white/[0.08] px-4 py-3.5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={cn('w-3.5 h-3.5', card.iconColor)} strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-sub">
                {card.label}
              </span>
            </div>

            <div className="flex items-baseline gap-0.5">
              <span className={cn('text-2xl font-bold tabular-nums leading-none', card.getColor(kpis))}>
                {card.key === 'efficiency' && kpis.efficiency != null ? '+' : ''}
                <CountUp value={val} />
              </span>
              <span className="text-xs text-text-sub ml-0.5">
                {card.getSuffix(kpis)}
              </span>
              <Arrow curr={val} prev={prev} />
            </div>

            <p className="text-[11px] text-text-sub mt-1.5">{card.getSub(kpis)}</p>
          </div>
        )
      })}
    </div>
  )
}
