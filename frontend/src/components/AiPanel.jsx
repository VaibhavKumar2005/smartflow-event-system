import { Sparkles, Clock, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

function Row({ label, value, valueClass = 'text-text-main' }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-text-sub flex-shrink-0">{label}</span>
      <span className={cn('text-xs font-semibold text-right', valueClass)}>{value}</span>
    </div>
  )
}

export default function AiPanel({ lastRoute, loading }) {
  const risk = lastRoute?.riskLevel  ?? 'low'
  const conf = lastRoute?.confidence ?? 'high'

  const riskColor = { low: 'text-success', medium: 'text-warning', high: 'text-danger' }
  const confColor = { high: 'text-success', medium: 'text-warning', low: 'text-danger' }
  const riskBg    = { low: 'bg-success/10 text-success border-success/20', medium: 'bg-warning/10 text-warning border-warning/20', high: 'bg-danger/10 text-danger border-danger/20' }

  return (
    <div className="bg-surface rounded-2xl border border-white/[0.08] overflow-hidden flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-text-main">AI Recommendation</span>
        </div>
        {lastRoute && (
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', riskBg[risk])}>
            {risk} risk
          </span>
        )}
      </div>

      <div className="px-4 py-4">

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
            <p className="text-xs text-text-sub">Analyzing crowd patterns…</p>
          </div>
        )}

        {/* Idle */}
        {!loading && !lastRoute && (
          <p className="text-xs text-text-sub leading-relaxed py-1">
            Select a destination and click{' '}
            <strong className="text-text-main font-semibold">Get Route</strong>{' '}
            to see AI crowd analysis and the recommended path.
          </p>
        )}

        {/* Result */}
        {!loading && lastRoute && (
          <div className="space-y-3 animate-fade-in">

            {/* Destination */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-sub mb-0.5">Route</p>
              <p className="text-[13px] font-bold text-text-main">
                → {lastRoute.destination?.label}
              </p>
            </div>

            {/* Recommendation */}
            {lastRoute.recommendation && (
              <p className="text-xs leading-relaxed text-text-sub border-l-2 border-primary/40 pl-3">
                {lastRoute.recommendation}
              </p>
            )}

            {/* Metrics */}
            <div className="space-y-2 pt-2 border-t border-white/[0.07]">
              <Row label="Time Saved"  value={lastRoute.timeSaved || '—'} valueClass="text-success" />
              <Row label="Risk Level"  value={risk.charAt(0).toUpperCase() + risk.slice(1)} valueClass={riskColor[risk]} />
              <Row label="Confidence"  value={conf.charAt(0).toUpperCase() + conf.slice(1)} valueClass={confColor[conf]} />
              {lastRoute.routeReason && (
                <Row label="Why" value={lastRoute.routeReason} valueClass="text-text-sub" />
              )}
            </div>

            {/* Avoid zones */}
            {lastRoute.avoidZoneLabels?.length > 0 && (
              <div className="pt-2 border-t border-white/[0.07]">
                <div className="flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="w-3 h-3 text-warning" strokeWidth={2} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-sub">Avoid</p>
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

          </div>
        )}
      </div>
    </div>
  )
}
