import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Users, Clock, ShieldCheck, Zap } from 'lucide-react'

// ── Count-up animation ─────────────────────────────────────────
function CountUp({ value, duration = 600 }) {
  const [current, setCurrent] = useState(0)
  const prevRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to = typeof value === 'number' ? value : 0
    if (from === to) { setCurrent(to); return }

    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const pct = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - pct, 3)
      setCurrent(Math.round(from + (to - from) * eased))
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        prevRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      prevRef.current = to
    }
  }, [value, duration])

  return current
}

// ── Trend arrow ────────────────────────────────────────────────
function TrendArrow({ current, prev }) {
  if (prev == null) return null
  const dir = current > prev ? 'up' : current < prev ? 'down' : 'flat'
  return (
    <span className={cn('text-[10px] font-bold ml-1',
      dir === 'up' ? 'text-high' : dir === 'down' ? 'text-low' : 'text-slate-500'
    )}>
      {dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→'}
    </span>
  )
}

// ── Card definition ────────────────────────────────────────────
const cards = [
  {
    key:      'density',
    label:    'Crowd Level',
    icon:     <Users className="w-3.5 h-3.5" strokeWidth={2} />,
    iconBg:   'bg-brand-500/10 text-brand-400 border border-brand-500/20',
    barColor: 'from-brand-500 to-accent-400',
    getValue: (k) => k.densityScore,
    getSuffix:(k) => '%',
    getPrev:  (k) => k.prevDensityScore,
    getBar:   (k) => k.densityScore,
    getSub:   (k) => k.densityLabel,
    getColor: (k) => k.densityScore > 60 ? 'text-high' : k.densityScore > 30 ? 'text-medium' : 'text-low',
  },
  {
    key:      'wait',
    label:    'Avg Wait',
    icon:     <Clock className="w-3.5 h-3.5" strokeWidth={2} />,
    iconBg:   'bg-accent-500/10 text-accent-400 border border-accent-500/20',
    barColor: 'from-accent-400 to-brand-400',
    getValue: (k) => k.avgWait,
    getSuffix:() => ' min',
    getPrev:  (k) => k.prevAvgWait,
    getBar:   (k) => (k.avgWait / 10) * 100,
    getSub:   (k) => k.avgWait > 7 ? 'Elevated' : 'Acceptable',
    getColor: () => 'text-white',
  },
  {
    key:      'safe',
    label:    'Safe Zones',
    icon:     <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />,
    iconBg:   'bg-low/10 text-low border border-low/20',
    barColor: 'from-low to-brand-400',
    getValue: (k) => k.safeZones,
    getSuffix:(k) => ` / ${k.totalZones}`,
    getPrev:  (k) => k.prevSafeZones,
    getBar:   (k) => (k.safeZones / k.totalZones) * 100,
    getSub:   (k) => k.safeZones >= 12 ? 'Favorable' : k.safeZones >= 6 ? 'Moderate' : 'Limited',
    getColor: (k) => k.safeZones >= 12 ? 'text-low' : k.safeZones >= 6 ? 'text-medium' : 'text-high',
  },
  {
    key:      'efficiency',
    label:    'Route Eff.',
    icon:     <Zap className="w-3.5 h-3.5" strokeWidth={2} />,
    iconBg:   'bg-accent-500/10 text-accent-400 border border-accent-500/20',
    barColor: 'from-accent-400 to-low',
    getValue: (k) => k.efficiency ?? 0,
    getSuffix:() => '%',
    getPrev:  () => null,
    getBar:   (k) => k.efficiency ?? 0,
    getSub:   (k) => k.efficiency !== null ? 'vs direct path' : 'No route yet',
    getColor: (k) => k.efficiency === null ? 'text-slate-500' : k.efficiency >= 20 ? 'text-low' : 'text-medium',
  },
]

// ── Framer Motion variants ─────────────────────────────────────
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// ── Component ──────────────────────────────────────────────────
export default function KpiStrip({ kpis }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-4 gap-2.5 px-5 py-2.5 flex-shrink-0"
    >
      {cards.map(card => {
        const numValue = card.getValue(kpis)
        const prevValue = card.getPrev(kpis)
        return (
          <motion.div
            key={card.key}
            variants={cardVariants}
            className="glass rounded-xl px-4 pt-3 pb-0 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', card.iconBg)}>
                {card.icon}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{card.label}</span>
            </div>

            <div className="flex items-baseline gap-0.5">
              <span className={cn('text-2xl font-extrabold leading-none tabular-nums', card.getColor(kpis))}>
                {card.key === 'efficiency' && kpis.efficiency !== null ? '+' : ''}
                <CountUp value={numValue} />
              </span>
              <span className="text-xs text-slate-500 font-medium">{card.getSuffix(kpis)}</span>
              <TrendArrow current={numValue} prev={prevValue} />
            </div>

            <div className="text-[10px] text-slate-500 mt-0.5 mb-2">{card.getSub(kpis)}</div>

            {/* Progress bar */}
            <div className="h-[2px] bg-surface-300 -mx-4 rounded-b-xl">
              <div
                className={cn('h-full rounded-b-xl bg-gradient-to-r transition-all duration-700', card.barColor)}
                style={{ width: `${Math.min(100, Math.max(0, card.getBar(kpis)))}%` }}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
