import { AlertTriangle, Users, CheckCircle, TrendingUp } from 'lucide-react'

export default function StatsRow({ zones, volunteers, assignments }) {
  const criticalZones   = zones.filter(z => z.priorityScore >= 7).length
  const availableVols   = volunteers.filter(v => v.available).length
  const activeAssign    = assignments.filter(a => a.status === 'active').length
  const totalAffected   = zones.reduce((s, z) => s + (z.peopleAffected || 0), 0)

  const cards = [
    {
      label: 'Active Zones',
      value: zones.length,
      sub:   `${criticalZones} critical`,
      icon:  <AlertTriangle size={20} />,
      color: 'text-red-400',
      bg:    'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Volunteers',
      value: volunteers.length,
      sub:   `${availableVols} available`,
      icon:  <Users size={20} />,
      color: 'text-emerald-400',
      bg:    'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Assignments',
      value: activeAssign,
      sub:   'active right now',
      icon:  <CheckCircle size={20} />,
      color: 'text-blue-400',
      bg:    'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'People Affected',
      value: totalAffected.toLocaleString(),
      sub:   'across all zones',
      icon:  <TrendingUp size={20} />,
      color: 'text-amber-400',
      bg:    'bg-amber-500/10 border-amber-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
          <div className={`flex items-center gap-2 mb-2 ${c.color}`}>
            {c.icon}
            <span className="text-xs font-medium uppercase tracking-wide">{c.label}</span>
          </div>
          <div className="text-2xl font-bold text-white">{c.value}</div>
          <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
        </div>
      ))}
    </div>
  )
}
