import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

// ── Density styles ─────────────────────────────────────────────
const DENSITY_STYLES = {
  low:    'bg-gradient-to-br from-emerald-500/80 to-emerald-700/80',
  medium: 'bg-gradient-to-br from-amber-400/80 to-amber-600/80',
  high:   'bg-gradient-to-br from-red-500/80 to-red-700/80',
}

// ── SVG route overlay ──────────────────────────────────────────
function RouteOverlay({ path, gridSize }) {
  const cellSize = 100 / gridSize

  const { points, totalLength } = useMemo(() => {
    if (!path || path.length < 2) return { points: [], totalLength: 0 }

    const pts = path.map(idx => ({
      x: (idx % gridSize + 0.5) * cellSize,
      y: (Math.floor(idx / gridSize) + 0.5) * cellSize,
    }))

    let len = 0
    for (let i = 1; i < pts.length; i++) {
      len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    }

    return { points: pts, totalLength: len }
  }, [path, gridSize, cellSize])

  if (points.length < 2) return null

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 15 }}
    >
      <defs>
        <marker id="route-arrow" viewBox="0 0 10 7" refX="9" refY="3.5"
          markerWidth="6" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 3.5 L 0 7 Z" fill="#00D1FF" />
        </marker>
        <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8FF53" />
          <stop offset="100%" stopColor="#00D1FF" />
        </linearGradient>
        <filter id="route-glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Glow underline */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke="rgba(168, 255, 83, 0.2)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: totalLength,
          strokeDashoffset: totalLength,
          animation: 'drawRoute 1.2s ease-out forwards',
        }}
      />

      {/* Main path */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke="url(#route-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#route-glow)"
        markerEnd="url(#route-arrow)"
        style={{
          strokeDasharray: totalLength,
          strokeDashoffset: totalLength,
          animation: 'drawRoute 1.2s ease-out 0.1s forwards',
        }}
      />

      {/* Step dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === 0 || i === points.length - 1 ? 2.5 : 1.3}
          fill={i === 0 ? 'white' : i === points.length - 1 ? '#00D1FF' : '#A8FF53'}
          opacity={0}
          style={{
            animation: `routePulse 2s ease-in-out ${0.3 + i * 0.15}s infinite`,
          }}
        />
      ))}
    </svg>
  )
}

// ── Zone cell ──────────────────────────────────────────────────
function ZoneCell({ index, density, label, isUser, isOnPath, isDest, crowdPct, gridSize }) {
  const style = DENSITY_STYLES[density] ?? DENSITY_STYLES.low
  const row = Math.floor(index / gridSize)
  const col = index % gridSize

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: (row * gridSize + col) * 0.018, duration: 0.3 }}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg cursor-default transition-all duration-500',
        style,
        isOnPath && !isDest && 'ring-2 ring-accent-400/60 ring-offset-1 ring-offset-surface-500',
        isDest && 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-surface-500',
        isUser && 'ring-2 ring-white ring-offset-1 ring-offset-surface-500',
        !isOnPath && !isDest && !isUser && 'hover:scale-105 hover:z-10',
      )}
      title={`${label} — ${density} (${crowdPct}%)`}
    >
      {/* Corner index */}
      <span className="absolute top-0.5 right-1 text-[7px] font-semibold text-white/25 pointer-events-none">
        {index}
      </span>

      {/* Zone name */}
      <span className="text-[7.5px] font-bold text-white/85 text-center leading-tight pointer-events-none max-w-full px-0.5">
        {label}
      </span>

      {/* Crowd percentage */}
      <span className={cn(
        'text-[8px] font-semibold mt-0.5 pointer-events-none',
        crowdPct > 70 ? 'text-white/90' : crowdPct > 40 ? 'text-white/60' : 'text-white/40'
      )}>
        {crowdPct}%
      </span>

      {/* User marker */}
      {isUser && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[6px] font-extrabold text-black bg-brand-500 px-1.5 rounded-full whitespace-nowrap shadow-brand"
          style={{ zIndex: 20 }}
        >
          YOU
        </motion.span>
      )}

      {/* Destination pin */}
      {isDest && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MapPin className="w-4 h-4 text-cyan-300 drop-shadow animate-float" strokeWidth={2.5} />
        </div>
      )}

      {/* Route cell pulse */}
      {isOnPath && !isDest && !isUser && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-lg border border-accent-400/25 pointer-events-none"
        />
      )}
    </motion.div>
  )
}

// ── Main heatmap ───────────────────────────────────────────────
export default function Heatmap({ zones, zoneLabels, userPos, activePath, lastRoute, gridSize, crowdPercentages }) {
  const destIndex = lastRoute?.destination?.gridIndex ?? -1
  const pcts = crowdPercentages ?? zones.map(z => z === 'high' ? 80 : z === 'medium' ? 50 : 20)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass flex-1 rounded-2xl shadow-card flex flex-col min-h-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Stadium Heatmap</span>
          <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Live</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3">
          {[['low', 'bg-emerald-500', 'Low'], ['medium', 'bg-amber-400', 'Med'], ['high', 'bg-red-500', 'High']].map(([, bg, lbl]) => (
            <div key={lbl} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${bg}`} />
              <span className="text-[10px] text-slate-500">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="relative" style={{ maxWidth: 440, width: '100%', aspectRatio: '1' }}>
          <div
            className="grid gap-1.5 w-full h-full"
            style={{ gridTemplateColumns: `repeat(${gridSize || 5}, 1fr)` }}
          >
            {zones.map((density, i) => (
              <ZoneCell
                key={i}
                index={i}
                density={density}
                label={zoneLabels[i] ?? `Zone ${i}`}
                isUser={i === userPos}
                isOnPath={activePath.includes(i) && i !== userPos}
                isDest={i === destIndex && activePath.includes(i)}
                crowdPct={pcts[i] ?? 0}
                gridSize={gridSize || 5}
              />
            ))}
          </div>

          {/* SVG route overlay — keyed to re-trigger animation on new routes */}
          <RouteOverlay key={activePath.join('-')} path={activePath} gridSize={gridSize || 5} />
        </div>
      </div>

      {/* Active route bar */}
      {activePath.length > 0 && lastRoute && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-xs text-slate-300"
        >
          <svg className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>
            Route to <strong className="text-white">{lastRoute.destination?.label}</strong>
            {' · '}{activePath.length} zones{' · '}
            <strong className="text-accent-400">{lastRoute.timeSaved}</strong> saved
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}
