import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Clock, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Confidence / Risk color ──────────────────────────────────────
const RISK_COLOR = { low: 'text-success', medium: 'text-warning', high: 'text-danger' }
const CONF_COLOR = { high: 'text-success', medium: 'text-warning', low: 'text-danger' }
const RISK_BG    = { low: 'bg-success/10 border-success/20', medium: 'bg-warning/10 border-warning/20', high: 'bg-danger/10 border-danger/20' }

// ── Tiny label + value row ───────────────────────────────────────
function MetaRow({ icon, label, value, valueClass = 'text-slate-200' }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-4 h-4 mt-0.5 text-muted flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">{label}</p>
        <p className={cn('text-[12px] font-medium leading-snug', valueClass)}>{value}</p>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function AiPanel({ lastRoute, loading }) {
  const risk = lastRoute?.riskLevel  ?? 'low'
  const conf = lastRoute?.confidence ?? 'high'

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card overflow-hidden flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-slate-200">AI Recommendation</span>
        </div>
        {lastRoute && (
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
            RISK_BG[risk]
          )}>
            {risk} risk
          </span>
        )}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 py-4"
            >
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-[12px] text-muted">Analyzing crowd patterns…</p>
            </motion.div>
          )}

          {/* ── Idle ── */}
          {!loading && !lastRoute && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2 py-4"
            >
              <p className="text-[12px] text-muted leading-relaxed">
                Select a destination and click <strong className="text-slate-400">Get Route</strong> to see the AI's crowd analysis and recommended path.
              </p>
            </motion.div>
          )}

          {/* ── Result (instant render, no typewriter) ── */}
          {!loading && lastRoute && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Destination */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">Route</p>
                <p className="text-[13px] font-semibold text-slate-100">
                  → {lastRoute.destination?.label}
                </p>
              </div>

              {/* Recommendation text */}
              {lastRoute.recommendation && (
                <p className="text-[12px] leading-relaxed text-slate-300 border-l-2 border-primary/40 pl-3">
                  {lastRoute.recommendation}
                </p>
              )}

              {/* Meta grid */}
              <div className="space-y-3 pt-1 border-t border-white/[0.06]">
                <MetaRow
                  icon={<Clock className="w-4 h-4" strokeWidth={1.8} />}
                  label="Time Saved"
                  value={lastRoute.timeSaved || '—'}
                  valueClass="text-success"
                />
                <MetaRow
                  icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.8} />}
                  label="Risk Level"
                  value={risk.charAt(0).toUpperCase() + risk.slice(1)}
                  valueClass={RISK_COLOR[risk]}
                />
                <MetaRow
                  icon={<Zap className="w-4 h-4" strokeWidth={1.8} />}
                  label="Confidence"
                  value={conf.charAt(0).toUpperCase() + conf.slice(1)}
                  valueClass={CONF_COLOR[conf]}
                />
                {lastRoute.routeReason && (
                  <MetaRow
                    icon={<Sparkles className="w-4 h-4" strokeWidth={1.8} />}
                    label="Why This Path"
                    value={lastRoute.routeReason}
                    valueClass="text-slate-400"
                  />
                )}
              </div>

              {/* Avoid zones */}
              {lastRoute.avoidZoneLabels?.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3 h-3 text-warning" strokeWidth={2} />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Avoid</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lastRoute.avoidZoneLabels.map(z => (
                      <span key={z} className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-danger/10 text-red-300 border border-danger/20">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
