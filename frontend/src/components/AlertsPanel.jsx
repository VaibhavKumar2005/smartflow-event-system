import { cn } from '@/lib/utils'

const SEV = {
  high:   { bar: 'bg-high',   text: 'text-high',   dot: 'bg-high' },
  medium: { bar: 'bg-medium', text: 'text-medium',  dot: 'bg-medium' },
  info:   { bar: 'bg-brand-500', text: 'text-brand-400', dot: 'bg-brand-400' },
}

export default function AlertsPanel({ alerts = [] }) {
  const highCount = alerts.filter(a => a.severity === 'high').length

  return (
    <div className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-high/10 border border-high/20 flex items-center justify-center text-high">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Alerts</span>
        </div>
        {highCount > 0 && (
          <span className="text-[9px] font-bold text-white bg-high rounded-full w-4 h-4 flex items-center justify-center">
            {highCount}
          </span>
        )}
      </div>

      <div className="p-2 space-y-1 max-h-[160px] overflow-y-auto">
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 px-2 py-2 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-low" />
            All clear — no active alerts
          </div>
        )}
        {alerts.map((alert, i) => {
          const s = SEV[alert.severity] ?? SEV.info
          return (
            <div
              key={alert.id ?? i}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-300/60 border-l-2 text-[11px] transition-all duration-200',
                s.bar.replace('bg-', 'border-'),
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
              <span className="flex-1 text-slate-300 truncate">{alert.text}</span>
              <span className="text-[9px] text-slate-600 flex-shrink-0">{alert.time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
