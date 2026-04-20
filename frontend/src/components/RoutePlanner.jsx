import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigation, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RoutePlanner({ destinations, zones, loading, lastRoute, onSubmit, onClear }) {
  const [destKey, setDestKey] = useState(destinations[0]?.key ?? '')

  const selected    = destinations.find(d => d.key === destKey)
  const destDensity = selected ? zones?.[selected.gridIndex] : null

  const DENSITY_COLOR = {
    low:    'text-success',
    medium: 'text-warning',
    high:   'text-danger',
  }

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card overflow-hidden flex-shrink-0">

      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
        <Navigation className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
        <span className="text-sm font-semibold text-slate-200">Route Planner</span>
      </div>

      <form
        onSubmit={e => { e.preventDefault(); destKey && !loading && onSubmit(destKey) }}
        className="p-5 space-y-3"
      >
        {/* Destination picker */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted mb-2">
            Destination
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" strokeWidth={2} />
            <select
              value={destKey}
              onChange={e => setDestKey(e.target.value)}
              disabled={loading}
              className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-[#1e293b] border border-white/[0.08] text-sm text-slate-200 font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-150 disabled:opacity-50"
            >
              {destinations.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Destination density hint */}
        <AnimatePresence>
          {destDensity && (
            <motion.div
              key={destKey}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]"
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                destDensity === 'high' ? 'bg-danger' : destDensity === 'medium' ? 'bg-warning' : 'bg-success'
              )} />
              <span className="text-[11px] text-muted">
                Current density:{' '}
                <strong className={cn('font-semibold', DENSITY_COLOR[destDensity])}>
                  {destDensity.charAt(0).toUpperCase() + destDensity.slice(1)}
                </strong>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !destKey}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating…
            </>
          ) : 'Get Route'}
        </button>

        {/* Clear */}
        {lastRoute && !loading && (
          <button
            type="button"
            onClick={onClear}
            className="w-full text-[11px] font-medium text-muted hover:text-slate-300 transition-colors duration-150 py-1"
          >
            Clear route
          </button>
        )}
      </form>
    </div>
  )
}
