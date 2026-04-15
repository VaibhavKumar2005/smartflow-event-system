import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const LABELS = ['T-7', 'T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now']

function jitter(base, range) {
  return LABELS.map((_, i) => {
    const noise = Math.round((Math.random() - 0.5) * range * 2)
    return i === LABELS.length - 1 ? base : Math.max(0, base + noise)
  })
}

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

export default function TrendChart({ zones }) {
  const data = useMemo(() => {
    const hi = zones.filter(z => z === 'high').length
    const md = zones.filter(z => z === 'medium').length
    const lo = zones.filter(z => z === 'low').length

    const hArr = jitter(hi, 2)
    const mArr = jitter(md, 2)
    const lArr = jitter(lo, 2)

    return LABELS.map((label, i) => ({
      label,
      High:   hArr[i],
      Medium: mArr[i],
      Low:    lArr[i],
    }))
  }, [zones])  // eslint-disable-line

  return (
    <div className="glass rounded-2xl shadow-card overflow-hidden flex-shrink-0 h-[110px]">
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
        <div className="w-5 h-5 rounded-md bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">Crowd Trend</span>
      </div>

      <ResponsiveContainer width="100%" height={72}>
        <LineChart data={data} margin={{ top: 2, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="hsl(220,20%,12%)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(220,15%,38%)', fontSize: 9, fontFamily: 'Inter' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(220,15%,35%)', fontSize: 8, fontFamily: 'Inter' }}
            axisLine={false} tickLine={false} tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle" iconSize={6}
            wrapperStyle={{ fontSize: 9, fontFamily: 'Inter', color: 'hsl(220,15%,40%)', paddingTop: 0 }}
          />
          <Line type="monotone" dataKey="High"   stroke="hsl(0,70%,54%)"   strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Medium" stroke="hsl(38,90%,52%)"  strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="Low"    stroke="hsl(142,65%,48%)" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
