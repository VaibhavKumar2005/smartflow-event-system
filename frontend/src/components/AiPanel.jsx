import { Sparkles, Clock, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Tiny label + value row ───────────────────────────────────────
function Row({ label, value, valueClass = 'text-text-main', icon }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-text-sub flex-shrink-0 mt-0.5">{label}</span>
      <span className={cn('text-xs font-medium text-right', valueClass)}>{value}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function AiPanel({ lastRoute, loading }) {
  const risk = lastRoute?.riskLevel  ?? 'low'
  const conf = lastRoute?.confidence ?? 'high'

  const riskColor = { low: 'text-success', medium: 'text-warning', high: 'text-danger' }
  const confColor = { high: 'text-success', medium: 'text-warning', low: 'text-danger' }

  return (
    <div className="bg-card rounded-2xl border border-white/[0.05] overflow-hidden flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent opacity-80" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-text-main">AI Recommendation</span>
        </div>
        {lastRoute && (
          <span className={cn(
            'text-[10px] font-medium px-2 py-0.5 rounded-full',
            risk === 'low'    ? 'bg-success/10 text-success' :
            risk === 'medium' ? 'bg-warning/10 text-warning' :
                                'bg-danger/10 text-danger',
          )}>
            {risk} risk
          </span>
        )}
      </div>

      <div className="px-4 py-4">

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
            <p className="text-xs text-text-sub">Analyzing crowd patterns…</p>
          </div>
        )}

        {/* Idle */}
        {!loading && !lastRoute && (
          <p className="text-xs text-text-sub leading-relaxed py-1">
            Select a destination and click <strong className="text-text-main font-medium">Get Route</strong> to see crowd analysis and the recommended path.
          </p>
        )}

        {/* Result — document-style, no animations */}
        {!loading && lastRoute && (
          <div className="space-y-3 text-sm animate-fade-in">

            {/* Route */}
            <div>
              <p className="text-[10px] text-text-sub uppercase tracking-wider mb-0.5">Route</p>
              <p className="text-[13px] font-semibold text-text-main">
                → {lastRoute.destination?.label}
              </p>
            </div>

            {/* Recommendation */}
            {lastRoute.recommendation && (
              <p className="text-xs leading-relaxed text-text-sub border-l border-primary/30 pl-2.5">
                {lastRoute.recommendation}
              </p>
            )}

            {/* Metrics grid */}
            <div className="space-y-2 pt-2 border-t border-white/[0.05]">
              <Row label="Time Saved"  value={lastRoute.timeSaved || '—'} valueClass="text-success" />
              <Row label="Risk Level"  value={risk.charAt(0).toUpperCase() + risk.slice(1)} valueClass={riskColor[risk]} />
              <Row label="Confidence"  value={conf.charAt(0).toUpperCase() + conf.slice(1)} valueClass={confColor[conf]} />
              {lastRoute.routeReason && (
                <Row label="Why" value={lastRoute.routeReason} valueClass="text-text-sub" />
              )}
            </div>

            {/* Avoid zones */}
            {lastRoute.avoidZoneLabels?.length > 0 && (
              <div className="pt-2 border-t border-white/[0.05]">
                <div className="flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-warning opacity-70" strokeWidth={2} />
                  <p className="text-[10px] font-medium uppercase tracking-wider text-text-sub">Avoid</p>
                </div>
                <p className="text-xs text-danger/80 leading-snug">
                  {lastRoute.avoidZoneLabels.join(', ')}
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
