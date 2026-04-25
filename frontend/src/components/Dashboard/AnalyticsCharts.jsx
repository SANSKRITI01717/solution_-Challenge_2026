import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getPriorityColor } from '../../utils/priority'

const SKILL_COLORS = { rescue: '#ef4444', medical: '#3b82f6', logistics: '#a855f7' }

export default function AnalyticsCharts({ zones, volunteers }) {
  // Bar chart: top 6 zones by priority
  const barData = [...zones]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6)
    .map(z => ({
      name:  z.name.length > 14 ? z.name.slice(0, 14) + '…' : z.name,
      score: parseFloat(z.priorityScore?.toFixed(2) || 0),
      color: getPriorityColor(z.priorityScore),
    }))

  // Pie chart: volunteers by skill
  const skillMap = {}
  volunteers.forEach(v => { skillMap[v.skill] = (skillMap[v.skill] || 0) + 1 })
  const pieData = Object.entries(skillMap).map(([k, v]) => ({ name: k, value: v }))

  const CustomTooltipBar = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs">
        <p className="text-slate-400">{payload[0].payload.name}</p>
        <p className="text-white font-bold">Priority: {payload[0].value}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Priority bar chart */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Zone Priority Scores
        </h3>
        {barData.length === 0
          ? <p className="text-slate-500 text-sm text-center py-8">No zone data</p>
          : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipBar />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Volunteer skill pie chart */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Volunteer Skills Distribution
        </h3>
        {pieData.length === 0
          ? <p className="text-slate-500 text-sm text-center py-8">No volunteer data</p>
          : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={40} outerRadius={70}
                  paddingAngle={4} dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={SKILL_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Legend
                  formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>}
                />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )
        }
      </div>
    </div>
  )
}
