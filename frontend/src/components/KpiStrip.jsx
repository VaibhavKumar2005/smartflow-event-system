import { cn } from '@/lib/utils'

const cards = [
  {
    key:   'density',
    label: 'Crowd Level',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
    iconBg: 'bg-brand-500/10 text-brand-400 border border-brand-500/20',
    barColor: 'from-brand-500 to-accent-400',
    getValue: (k) => k.densityLabel,
    getBar:   (k) => k.densityScore,
    getSub:   (k) => k.densityScore > 50 ? 'Above normal' : 'Normal range',
    getColor: (k) => k.densityScore > 60 ? 'text-high' : k.densityScore > 30 ? 'text-medium' : 'text-low',
  },
  {
    key:   'wait',
    label: 'Avg Wait',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
      </svg>
    ),
    iconBg: 'bg-accent-500/10 text-accent-400 border border-accent-500/20',
    barColor: 'from-accent-400 to-brand-400',
    getValue: (k) => `${k.avgWait} min`,
    getBar:   (k) => (k.avgWait / 10) * 100,
    getSub:   (k) => k.avgWait > 7 ? 'Elevated' : 'Acceptable',
    getColor: () => 'text-white',
  },
  {
    key:   'safe',
    label: 'Safe Zones',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    iconBg: 'bg-low/10 text-low border border-low/20',
    barColor: 'from-low to-brand-400',
    getValue: (k) => k.safeZones,
    getBar:   (k) => (k.safeZones / k.totalZones) * 100,
    getSub:   (k) => `of ${k.totalZones} zones`,
    getColor: (k) => k.safeZones >= 12 ? 'text-low' : k.safeZones >= 6 ? 'text-medium' : 'text-high',
  },
  {
    key:   'efficiency',
    label: 'Route Eff.',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    iconBg: 'bg-accent-500/10 text-accent-400 border border-accent-500/20',
    barColor: 'from-accent-400 to-low',
    getValue: (k) => k.efficiency !== null ? `+${k.efficiency}%` : '—',
    getBar:   (k) => k.efficiency ?? 0,
    getSub:   (k) => k.efficiency !== null ? 'vs direct path' : 'No route yet',
    getColor: (k) => k.efficiency === null ? 'text-slate-500' : k.efficiency >= 20 ? 'text-low' : 'text-medium',
  },
]

export default function KpiStrip({ kpis }) {
  return (
    <div className="grid grid-cols-4 gap-2 px-5 py-2 flex-shrink-0">
      {cards.map(card => (
        <div
          key={card.key}
          className="glass rounded-xl px-3.5 pt-3 pb-0 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0', card.iconBg)}>
              {card.icon}
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{card.label}</span>
          </div>
          <div className={cn('text-[22px] font-extrabold leading-tight', card.getColor(kpis))}>
            {card.getValue(kpis)}
          </div>
          <div className="text-[10px] text-slate-500 mb-2">{card.getSub(kpis)}</div>
          {/* Progress bar */}
          <div className="h-[2px] bg-surface-300 -mx-3.5 rounded-b-xl">
            <div
              className={cn('h-full rounded-b-xl bg-gradient-to-r transition-all duration-700', card.barColor)}
              style={{ width: `${Math.min(100, Math.max(0, card.getBar(kpis)))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
