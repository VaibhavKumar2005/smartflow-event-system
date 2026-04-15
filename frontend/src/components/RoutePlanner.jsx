import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function RoutePlanner({ destinations, loading, lastRoute, onSubmit, onClear }) {
  const [destKey, setDestKey] = useState(destinations[0]?.key ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (destKey && !loading) onSubmit(destKey)
  }

  return (
    <div className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <div className="w-5 h-5 rounded-md bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
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
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !destKey}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200',
            'bg-gradient-to-r from-brand-500 to-accent-400 shadow-brand',
            'hover:-translate-y-0.5 hover:shadow-[0_8px_28px_hsla(226,85%,58%,0.45)]',
            'active:translate-y-0',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none',
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
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get AI Route
            </>
          )}
        </button>

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
    </div>
  )
}
