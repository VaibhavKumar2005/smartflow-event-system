import { cn } from '@/lib/utils'

const DENSITY_STYLES = {
  low:    { cell: 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-glow-green',    hover: 'hover:shadow-glow-green' },
  medium: { cell: 'bg-gradient-to-br from-amber-400 to-amber-600',                           hover: '' },
  high:   { cell: 'bg-gradient-to-br from-red-500 to-red-700 shadow-glow-red',              hover: 'hover:shadow-glow-red' },
}

function ZoneCell({ index, density, label, isUser, isOnPath, isDest }) {
  const styles = DENSITY_STYLES[density] ?? DENSITY_STYLES.low

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg p-1 cursor-default transition-all duration-200 hover:scale-105 hover:z-10',
        styles.cell,
        styles.hover,
        isOnPath && !isDest && 'ring-2 ring-accent-400 ring-offset-1 ring-offset-surface-500 animate-glow',
        isDest && 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-surface-500',
        isUser && 'ring-2 ring-white ring-offset-1 ring-offset-surface-500',
      )}
      title={`${label} — ${density}`}
    >
      {/* Corner index */}
      <span className="absolute top-0.5 right-1 text-[7px] font-semibold text-white/30 pointer-events-none">
        {index}
      </span>

      {/* Zone name */}
      <span className="text-[7px] font-bold text-white/80 text-center leading-tight pointer-events-none max-w-full px-0.5">
        {label}
      </span>

      {/* User marker */}
      {isUser && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[6px] font-extrabold text-white bg-brand-500 px-1 rounded-full whitespace-nowrap shadow-brand">
          YOU
        </span>
      )}

      {/* Destination pin */}
      {isDest && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-4 h-4 text-cyan-300 drop-shadow animate-float" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}

      {/* Path step number */}
      {isOnPath && !isDest && !isUser && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[11px] font-black text-purple-200 drop-shadow">
            {/* rendered by parent */}
          </span>
        </div>
      )}
    </div>
  )
}

export default function Heatmap({ zones, zoneLabels, userPos, activePath, lastRoute, gridSize }) {
  const destIndex = lastRoute?.destination?.gridIndex ?? -1

  return (
    <div className="glass flex-1 rounded-2xl shadow-card flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">Stadium Heatmap</span>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {[['low', 'bg-emerald-500', 'Low'], ['medium', 'bg-amber-400', 'Medium'], ['high', 'bg-red-500', 'High']].map(([, bg, lbl]) => (
            <div key={lbl} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${bg}`} />
              <span className="text-[10px] text-slate-500">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div
          className="grid gap-1.5 w-full"
          style={{
            gridTemplateColumns: `repeat(${gridSize || 5}, 1fr)`,
            maxWidth: 420,
            aspectRatio: '1',
          }}
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
            />
          ))}
        </div>
      </div>

      {/* Active route bar */}
      {activePath.length > 0 && lastRoute && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-500/10 border border-accent-500/20 text-xs text-slate-300">
          <svg className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>
            Route to <strong className="text-white">{lastRoute.destination?.label}</strong>
            {' · '}{activePath.length} zones{' · '}
            <strong className="text-accent-400">{lastRoute.timeSaved}</strong> saved
          </span>
        </div>
      )}
    </div>
  )
}
