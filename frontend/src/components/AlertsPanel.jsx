import { AlertTriangle } from 'lucide-react'
import { cn }            from '@/lib/utils'

const SEV_DOT = {
  high:   'bg-danger',
  medium: 'bg-warning',
  info:   'bg-primary',
}

export default function AlertsPanel({ alerts = [] }) {
  const highCount = alerts.filter(a => a.severity === 'high').length

  const sorted = [...alerts].sort((a, b) => {
    const order = { high: 0, medium: 1, info: 2 }
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2)
  })

  return (
    <div className="bg-surface rounded-2xl border border-white/[0.08] overflow-hidden flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" strokeWidth={2} />
          <span className="text-sm font-semibold text-text-main">Alerts</span>
        </div>
        {highCount > 0 && (
          <span className="text-[10px] font-bold text-white bg-danger rounded-full w-4.5 h-4.5 w-5 h-5 flex items-center justify-center leading-none">
            {highCount}
          </span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-white/[0.05] max-h-[160px] overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-text-sub">
            <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            All clear
          </div>
        )}

        {sorted.map((alert, i) => (
          <div key={alert.id ?? i} className="flex items-start gap-3 px-4 py-2.5">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1', SEV_DOT[alert.severity] ?? SEV_DOT.info)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-main leading-snug">{alert.text}</p>
              <p className="text-[10px] text-text-sub mt-0.5">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
