import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Activity } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-xl px-3 py-2 text-[11px] shadow-lg">
      <p className="text-muted font-medium mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}:</span>
          <span className="text-slate-200 font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ trendHistory }) {
  const data = trendHistory?.length ? trendHistory : []

  return (
    <div className="bg-card rounded-2xl border border-white/[0.06] shadow-card h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-3.5 pb-2 flex-shrink-0">
        <Activity className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        <span className="text-sm font-semibold text-slate-200">Crowd Trend</span>
        <span className="text-[10px] text-muted ml-1">{data.length} pts</span>
      </div>

      <div className="flex-1 min-h-0 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#f59e0b" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#22c55e" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 8, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 8, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false} tickCount={4}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="High"   name="High"   stroke="#ef4444" strokeWidth={1.5} fill="url(#gHigh)" dot={false} />
            <Area type="monotone" dataKey="Medium" name="Medium" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gMed)"  dot={false} />
            <Area type="monotone" dataKey="Low"    name="Low"    stroke="#22c55e" strokeWidth={1.5} fill="url(#gLow)"  dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
