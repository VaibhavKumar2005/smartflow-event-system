import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, Clock, Shield, Zap, AlertTriangle } from 'lucide-react'

// ── Risk / Confidence badge color maps ─────────────────────────
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

// ── Typewriter ─────────────────────────────────────────────────
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
        setTimeout(tick, Math.random() * 14 + 8)
      }
    }
    const id = setTimeout(tick, 80)
    return () => clearTimeout(id)
  }, [text])

  return <p className={className}>{displayed}<span className="animate-pulse">|</span></p>
}

// ── Insight badge ──────────────────────────────────────────────
function InsightBadge({ icon, label, value, colorClass }) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-center',
      colorClass
    )}>
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{label}</span>
      <span className="text-[11px] font-bold capitalize">{value}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function AiPanel({ lastRoute, loading }) {
  const risk = lastRoute?.riskLevel ?? 'low'
  const conf = lastRoute?.confidence ?? 'high'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
            <Sparkles className="w-3 h-3" strokeWidth={1.8} />
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
        <AnimatePresence mode="wait">

          {/* ── Loading: AI processing ── */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-6 gap-3"
            >
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full bg-accent-500/10 border border-accent-500/20 animate-ping" />
                <div className="relative w-10 h-10 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent-400 animate-pulse" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">AI analyzing crowd patterns…</p>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-400/50 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Idle state ── */}
          {!loading && !lastRoute && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-5 gap-2 text-center"
            >
              <div className="w-8 h-8 rounded-full bg-accent-500/10 border border-accent-500/20 flex items-center justify-center animate-float">
                <Sparkles className="w-4 h-4 text-accent-400" strokeWidth={1.8} />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Select a destination and click <strong className="text-slate-400">Get AI Route</strong> to see live recommendations.
              </p>
            </motion.div>
          )}

          {/* ── Result ── */}
          {!loading && lastRoute && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
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

              {/* ── Structured insight cards ── */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <InsightBadge
                  icon={<Clock className="w-3.5 h-3.5" strokeWidth={2} />}
                  label="Time Saved"
                  value={lastRoute.timeSaved ?? '—'}
                  colorClass="bg-cyan-500/5 border-cyan-500/15 text-cyan-400"
                />
                <InsightBadge
                  icon={<Shield className="w-3.5 h-3.5" strokeWidth={2} />}
                  label="Risk"
                  value={risk}
                  colorClass={RISK_BADGE[risk]}
                />
                <InsightBadge
                  icon={<Zap className="w-3.5 h-3.5" strokeWidth={2} />}
                  label="Confidence"
                  value={conf}
                  colorClass={CONF_BADGE[conf]}
                />
              </div>

              {/* Route reason */}
              {lastRoute.routeReason && (
                <div className="flex gap-1.5 items-start text-[11px] pt-1">
                  <svg className="w-3 h-3 flex-shrink-0 mt-0.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                  </svg>
                  <span className="text-slate-400 leading-tight">{lastRoute.routeReason}</span>
                </div>
              )}

              {/* Avoid tags */}
              {lastRoute.avoidZoneLabels?.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3 h-3 text-slate-600" strokeWidth={2} />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Avoid</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {lastRoute.avoidZoneLabels.map(z => (
                      <span key={z} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-high/10 text-red-400 border border-high/20">
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
    </motion.div>
  )
}
