import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Navigation, MapPin, Zap } from 'lucide-react'

export default function RoutePlanner({ destinations, zones, loading, lastRoute, onSubmit, onClear }) {
  const [destKey, setDestKey] = useState(destinations[0]?.key ?? '')

  const selectedDest = destinations.find(d => d.key === destKey)
  const destDensity = selectedDest ? zones?.[selectedDest.gridIndex] : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (destKey && !loading) onSubmit(destKey)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <div className="w-5 h-5 rounded-md bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
          <Navigation className="w-3 h-3" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-white">Route Planner</span>
      </div>

      <form onSubmit={handleSubmit} className="p-3.5 space-y-3">
        {/* Destination select */}
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
            Destination
          </label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" strokeWidth={2} />
            <select
              value={destKey}
              onChange={e => setDestKey(e.target.value)}
              disabled={loading}
              className="w-full pl-8 pr-8 py-2 rounded-lg bg-surface-300 border border-border text-sm text-white font-medium appearance-none cursor-pointer focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors disabled:opacity-50"
            >
              {destinations.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Destination density preview */}
        {destDensity && (
          <motion.div
            key={destKey}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-300/60 border border-border"
          >
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0',
              destDensity === 'high' ? 'bg-high' : destDensity === 'medium' ? 'bg-medium' : 'bg-low'
            )} />
            <span className="text-[11px] text-slate-400">
              Currently:{' '}
              <strong className={cn(
                destDensity === 'high' ? 'text-high' : destDensity === 'medium' ? 'text-medium' : 'text-low'
              )}>
                {destDensity}
              </strong>{' '}density
            </span>
          </motion.div>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || !destKey}
          whileHover={!loading ? { y: -2 } : {}}
          whileTap={!loading ? { y: 0 } : {}}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-black transition-all duration-200',
            'bg-gradient-to-r from-brand-500 to-accent-400 shadow-brand',
            'hover:shadow-glow-brand',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
          )}
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating…
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
              Get AI Route
            </>
          )}
        </motion.button>

        {/* Clear */}
        {lastRoute && !loading && (
          <button
            type="button"
            onClick={onClear}
            className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors py-1"
          >
            Clear route
          </button>
        )}
      </form>
    </motion.div>
  )
}
