import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

const SEV = {
  high:   { bar: 'border-high',   dot: 'bg-high' },
  medium: { bar: 'border-medium', dot: 'bg-medium' },
  info:   { bar: 'border-brand-500', dot: 'bg-brand-400' },
}

export default function AlertsPanel({ alerts = [] }) {
  const highCount = alerts.filter(a => a.severity === 'high').length

  // Sort by severity: high → medium → info
  const sorted = useMemo(() => {
    const order = { high: 0, medium: 1, info: 2 }
    return [...alerts].sort((a, b) => (order[a.severity] ?? 2) - (order[b.severity] ?? 2))
  }, [alerts])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-high/10 border border-high/20 flex items-center justify-center text-high">
            <AlertTriangle className="w-3 h-3" strokeWidth={2} />
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
        {sorted.length === 0 && (
          <div className="flex items-center gap-2 px-2 py-2 text-[11px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-low" />
            All clear — no active alerts
          </div>
        )}

        <AnimatePresence>
          {sorted.map((alert, i) => {
            const s = SEV[alert.severity] ?? SEV.info
            return (
              <motion.div
                key={alert.id ?? i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                layout
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-300/60 border-l-2 text-[11px]',
                  s.bar,
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', s.dot)} />
                <span className="flex-1 text-slate-300 truncate">{alert.text}</span>
                <span className="text-[9px] text-slate-600 flex-shrink-0">{alert.time}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
