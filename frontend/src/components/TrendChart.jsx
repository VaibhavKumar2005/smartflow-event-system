import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Activity } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-200 border border-border rounded-lg px-3 py-2 text-[11px] shadow-card">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ trendHistory }) {
  const data = trendHistory?.length > 0 ? trendHistory : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0 h-[120px]"
    >
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
        <div className="w-5 h-5 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <Activity className="w-3 h-3" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-white">Crowd Trend</span>
        <span className="text-[9px] text-slate-500 font-medium">{data.length} snapshots</span>
      </div>

      <ResponsiveContainer width="100%" height={78}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0,70%,54%)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(0,70%,54%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38,90%,52%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(38,90%,52%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142,65%,48%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(142,65%,48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(220,20%,12%)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(220,15%,38%)', fontSize: 8, fontFamily: 'Inter' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(220,15%,35%)', fontSize: 8, fontFamily: 'Inter' }}
            axisLine={false} tickLine={false} tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="High"   stroke="hsl(0,70%,54%)"   strokeWidth={1.5} fill="url(#gradHigh)" dot={false} />
          <Area type="monotone" dataKey="Medium" stroke="hsl(38,90%,52%)"  strokeWidth={1.5} fill="url(#gradMed)"  dot={false} />
          <Area type="monotone" dataKey="Low"    stroke="hsl(142,65%,48%)" strokeWidth={1.5} fill="url(#gradLow)"  dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
