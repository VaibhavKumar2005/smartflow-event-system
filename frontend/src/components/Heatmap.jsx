import { useMemo }  from 'react'
import { MapPin }   from 'lucide-react'
import { cn }       from '@/lib/utils'

// ── Density → cell style (soft, no harsh gradients) ─────────────
function getCellStyle(density) {
  if (density === 'high')   return { bg: 'rgba(239,68,68,0.18)',   text: '#fca5a5', dot: '#ef4444' }
  if (density === 'medium') return { bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d', dot: '#f59e0b' }
  return                           { bg: 'rgba(34,197,94,0.14)',   text: '#86efac', dot: '#22c55e' }
}

// ── SVG route overlay ────────────────────────────────────────────
function RouteOverlay({ path, gridSize }) {
  const cellPct = 100 / gridSize

  const { points, len } = useMemo(() => {
    if (!path || path.length < 2) return { points: [], len: 0 }
    const pts = path.map(i => ({
      x: (i % gridSize + 0.5) * cellPct,
      y: (Math.floor(i / gridSize) + 0.5) * cellPct,
    }))
    let l = 0
    for (let i = 1; i < pts.length; i++) {
      l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    }
    return { points: pts, len: l }
  }, [path, gridSize, cellPct])

  if (points.length < 2) return null

  const polyStr = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <marker id="arr" viewBox="0 0 8 6" refX="7" refY="3"
          markerWidth="4" markerHeight="3.5" orient="auto">
          <path d="M 0 0 L 8 3 L 0 6 Z" fill="#8b5cf6" />
        </marker>
      </defs>

      {/* Shadow blur */}
      <polyline
        points={polyStr}
        fill="none"
        stroke="rgba(99,102,241,0.15)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main line */}
      <polyline
        points={polyStr}
        fill="none"
        stroke="url(#rg)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd="url(#arr)"
        style={{
          strokeDasharray: len,
          strokeDashoffset: len,
          animation: `drawRoute 0.7s ease-out forwards`,
        }}
      />

      {/* Waypoint dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x} cy={p.y}
          r={i === 0 || i === points.length - 1 ? 2.2 : 1.2}
          fill={i === 0 ? '#e5e7eb' : i === points.length - 1 ? '#8b5cf6' : '#6366f1'}
          opacity={0.85}
        />
      ))}
    </svg>
  )
}

// ── Zone cell ────────────────────────────────────────────────────
function ZoneCell({ density, label, isUser, isOnPath, isDest, crowdPct }) {
  const style = getCellStyle(density)

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl',
        'transition-colors duration-500 select-none cursor-default overflow-hidden',
        // Route highlight — thin indigo ring, no glow
        isOnPath && !isDest && !isUser && 'ring-1 ring-primary/50',
        isDest   && 'ring-1 ring-accent/60',
        isUser   && 'ring-1 ring-white/40',
      )}
      style={{ backgroundColor: style.bg }}
      title={`${label} — ${density} (${crowdPct}%)`}
    >
      {/* Density dot */}
      <span
        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full opacity-60"
        style={{ backgroundColor: style.dot }}
      />

      {/* Zone name */}
      <span
        className="text-[7px] font-medium text-center leading-tight px-1 truncate w-full text-center opacity-70"
        style={{ color: style.text }}
      >
        {label}
      </span>

      {/* Crowd % */}
      <span className="text-[9px] font-semibold tabular-nums mt-0.5" style={{ color: style.text }}>
        {crowdPct}%
      </span>

      {/* YOU badge */}
      {isUser && (
        <span className="absolute -bottom-px left-1/2 -translate-x-1/2 text-[6px] font-bold bg-white text-slate-900 px-1.5 py-px rounded-t-md leading-none whitespace-nowrap">
          YOU
        </span>
      )}

      {/* Destination pin */}
      {isDest && (
        <MapPin className="absolute top-1 left-1 w-2.5 h-2.5 opacity-70" style={{ color: style.dot }} strokeWidth={2.5} />
      )}
    </div>
  )
}

// ── Main Heatmap ─────────────────────────────────────────────────
export default function Heatmap({ zones, zoneLabels, userPos, activePath, lastRoute, gridSize, crowdPercentages }) {
  const gs      = gridSize || 5
  const destIdx = lastRoute?.destination?.gridIndex ?? -1
  const pcts    = crowdPercentages?.length
    ? crowdPercentages
    : zones.map(z => z === 'high' ? 78 : z === 'medium' ? 48 : 18)

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-white/[0.05] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-main">Stadium Heatmap</span>
          <span className="text-[10px] text-text-sub font-medium uppercase tracking-wider">Live</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-text-sub">
          {[['#22c55e', 'Low'], ['#f59e0b', 'Med'], ['#ef4444', 'High']].map(([color, lbl]) => (
            <div key={lbl} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
              {lbl}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          className="relative w-full"
          style={{ maxWidth: 560, aspectRatio: '1' }}
        >
          <div
            className="grid gap-2 w-full h-full"
            style={{ gridTemplateColumns: `repeat(${gs}, 1fr)` }}
          >
            {zones.map((density, i) => (
              <ZoneCell
                key={i}
                density={density}
                label={zoneLabels[i] ?? `Z${i}`}
                isUser={i === userPos}
                isOnPath={activePath.includes(i) && i !== userPos}
                isDest={i === destIdx && activePath.includes(i)}
                crowdPct={pcts[i] ?? 0}
              />
            ))}
          </div>

          <RouteOverlay key={activePath.join(',')} path={activePath} gridSize={gs} />
        </div>
      </div>

      {/* Active route bar */}
      {activePath.length > 0 && lastRoute && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/15 text-[11px] text-text-sub animate-fade-in">
          <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
          <span>
            Route to <strong className="text-text-main font-medium">{lastRoute.destination?.label}</strong>
            {' · '}{activePath.length} zones
            {lastRoute.timeSaved && (
              <> · <strong className="text-success font-medium">{lastRoute.timeSaved}</strong> saved</>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
