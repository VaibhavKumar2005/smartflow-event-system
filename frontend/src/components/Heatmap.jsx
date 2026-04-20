import { useMemo }             from 'react'
import { MapPin, Navigation }  from 'lucide-react'
import { cn }                  from '@/lib/utils'

// ── Density → visual style ──────────────────────────────────────
const CELL_STYLE = {
  low:    'bg-emerald-500/20  text-emerald-300  border-emerald-500/20',
  medium: 'bg-amber-500/20   text-amber-300    border-amber-500/20',
  high:   'bg-red-500/25     text-red-300      border-red-500/25',
}
const DOT_COLOR = {
  low:    'bg-emerald-400',
  medium: 'bg-amber-400',
  high:   'bg-red-400',
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
    for (let i = 1; i < pts.length; i++)
      l += Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y)
    return { points: pts, len: l }
  }, [path, gridSize, cellPct])

  if (points.length < 2) return null
  const polyStr = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <marker id="arr" viewBox="0 0 8 6" refX="7" refY="3" markerWidth="5" markerHeight="4" orient="auto">
          <path d="M 0 0 L 8 3 L 0 6 Z" fill="#8b5cf6" />
        </marker>
      </defs>
      <polyline points={polyStr} fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={polyStr} fill="none" stroke="url(#rg)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#arr)"
        style={{ strokeDasharray: len, strokeDashoffset: len, animation: 'drawRoute 0.8s ease-out forwards' }}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y}
          r={i === 0 || i === points.length - 1 ? 2.5 : 1.5}
          fill={i === 0 ? '#fff' : i === points.length - 1 ? '#8b5cf6' : '#6366f1'}
          opacity={0.9}
        />
      ))}
    </svg>
  )
}

// ── Zone cell ───────────────────────────────────────────────────
function ZoneCell({ density, label, isUser, isOnPath, isDest, crowdPct, isGpsTracked }) {
  const style  = CELL_STYLE[density] ?? CELL_STYLE.low
  const dotClr = DOT_COLOR[density]  ?? DOT_COLOR.low

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border',
        'transition-colors duration-500 select-none cursor-default overflow-hidden',
        style,
        isOnPath && !isDest && !isUser && 'ring-2 ring-primary/70 ring-offset-1 ring-offset-app',
        isDest   && 'ring-2 ring-accent/80 ring-offset-1 ring-offset-app',
        isUser   && 'ring-2 ring-white/60  ring-offset-1 ring-offset-app',
      )}
      title={`${label} — ${density} (${crowdPct}%)`}
    >
      <span className={cn('absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full opacity-70', dotClr)} />

      <span className="text-[7px] font-semibold text-center leading-tight px-1 opacity-80 truncate w-full text-center">
        {label}
      </span>
      <span className="text-[9px] font-bold tabular-nums mt-0.5 opacity-90">{crowdPct}%</span>

      {/* YOU badge — green outline when GPS-tracked, white when manual/server */}
      {isUser && (
        <span className={cn(
          'absolute -bottom-px left-1/2 -translate-x-1/2 text-[6px] font-bold px-1.5 py-px rounded-t-md leading-none whitespace-nowrap',
          isGpsTracked
            ? 'bg-success text-slate-900'
            : 'bg-white text-slate-900'
        )}>
          {isGpsTracked ? '📍 YOU' : 'YOU'}
        </span>
      )}

      {isDest && (
        <MapPin className="absolute top-1 left-1 w-3 h-3 text-accent opacity-80" strokeWidth={2.5} />
      )}
    </div>
  )
}

// ── Main Heatmap ────────────────────────────────────────────────
export default function Heatmap({ zones, zoneLabels, userPos, activePath, lastRoute, gridSize, crowdPercentages, gps }) {
  const gs      = gridSize || 5
  const destIdx = lastRoute?.destination?.gridIndex ?? -1
  const pcts    = crowdPercentages?.length
    ? crowdPercentages
    : zones.map(z => z === 'high' ? 78 : z === 'medium' ? 48 : 18)

  const isGpsTracked = gps?.isTracking || gps?.isSimulated

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-white/[0.06] shadow-card overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-slate-200">Stadium Heatmap</span>
          <span className="text-[10px] text-muted font-medium uppercase tracking-wider">Live</span>

          {/* GPS tracking chip */}
          {isGpsTracked && (
            <div className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border',
              gps.isTracking
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-warning/10 border-warning/20 text-warning'
            )}>
              <Navigation className="w-2.5 h-2.5" strokeWidth={2} />
              {gps.isTracking ? `GPS ±${gps.accuracy}m` : 'Simulated'}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted">
          {[['bg-emerald-400','Low'], ['bg-amber-400','Medium'], ['bg-red-400','High']].map(([bg, lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${bg}`} />
              {lbl}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="relative w-full" style={{ maxWidth: 560, aspectRatio: '1' }}>
          <div className="grid gap-1.5 w-full h-full" style={{ gridTemplateColumns: `repeat(${gs}, 1fr)` }}>
            {zones.map((density, i) => (
              <ZoneCell
                key={i}
                density={density}
                label={zoneLabels[i] ?? `Z${i}`}
                isUser={i === userPos}
                isOnPath={activePath.includes(i) && i !== userPos}
                isDest={i === destIdx && activePath.includes(i)}
                crowdPct={pcts[i] ?? 0}
                isGpsTracked={isGpsTracked && i === userPos}
              />
            ))}
          </div>
          <RouteOverlay key={activePath.join(',')} path={activePath} gridSize={gs} />
        </div>
      </div>

      {/* Active route bar */}
      {activePath.length > 0 && lastRoute && (
        <div className="mx-4 mb-3 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-[12px] text-slate-300 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          <span>
            Route to <strong className="text-slate-100">{lastRoute.destination?.label}</strong>
            {' · '}{activePath.length} zones
            {lastRoute.timeSaved && <> · <strong className="text-primary">{lastRoute.timeSaved}</strong> saved</>}
          </span>
        </div>
      )}
    </div>
  )
}
