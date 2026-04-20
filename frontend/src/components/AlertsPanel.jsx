import { useMemo }        from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle }  from 'lucide-react'
import { cn }             from '@/lib/utils'

const SEV_DOT = {
  high:   'bg-danger',
  medium: 'bg-warning',
  info:   'bg-primary',
}

export default function AlertsPanel({ alerts = [] }) {
  const highCount = alerts.filter(a => a.severity === 'high').length

  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, info: 2 }
    return [...alerts].sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2))
  }, [alerts])

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card overflow-hidden flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" strokeWidth={2} />
          <span className="text-sm font-semibold text-slate-200">Alerts</span>
        </div>
        {highCount > 0 && (
          <span className="text-[10px] font-bold text-white bg-danger rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {highCount}
          </span>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-white/[0.05] max-h-[180px] overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex items-center gap-2.5 px-5 py-3 text-[12px] text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
            All clear
          </div>
        )}

        <AnimatePresence>
          {sorted.map((alert, i) => (
            <motion.div
              key={alert.id ?? i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-3 px-5 py-3"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1', SEV_DOT[alert.severity] ?? SEV_DOT.info)} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-300 leading-snug truncate">{alert.text}</p>
                <p className="text-[10px] text-muted mt-0.5">{alert.time}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
