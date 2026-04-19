import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Activity } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] shadow-lg">
      <p className="text-text-sub mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-text-sub">{p.name}:</span>
          <span className="text-text-main font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrendChart({ trendHistory }) {
  const data = trendHistory?.length ? trendHistory : []

  return (
    <div className="bg-card rounded-2xl border border-white/[0.05] h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0">
        <Activity className="w-3 h-3 text-primary opacity-80" strokeWidth={2} />
        <span className="text-sm font-semibold text-text-main">Crowd Trend</span>
        <span className="text-[10px] text-text-sub ml-0.5">{data.length} pts</span>
      </div>

      <div className="flex-1 min-h-0 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 14, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#f59e0b" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#22c55e" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 8, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 8, fontFamily: 'Inter' }}
              axisLine={false} tickLine={false} tickCount={3}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="High"   name="High"   stroke="#ef4444" strokeWidth={1.2} fill="url(#gHigh)" dot={false} />
            <Area type="monotone" dataKey="Medium" name="Medium" stroke="#f59e0b" strokeWidth={1.2} fill="url(#gMed)"  dot={false} />
            <Area type="monotone" dataKey="Low"    name="Low"    stroke="#22c55e" strokeWidth={1.2} fill="url(#gLow)"  dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
