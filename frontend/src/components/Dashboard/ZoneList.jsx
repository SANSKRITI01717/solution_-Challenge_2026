import { getPriorityBg, getPriorityLevel, getPriorityColor, getSkillIcon } from '../../utils/priority'
import ZoneInsight from './ZoneInsight'
import { Trash2 } from 'lucide-react'
import { deleteZone } from '../../utils/api'
import toast from 'react-hot-toast'

export default function ZoneList({ zones, assignments, onRefresh }) {
  const sorted = [...zones].sort((a, b) => b.priorityScore - a.priorityScore)

  async function handleDelete(id) {
    try {
      await deleteZone(id)
      toast.success('Zone removed')
      onRefresh()
    } catch {
      toast.error('Failed to delete zone')
    }
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
        Priority Queue — Disaster Zones
      </h2>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {sorted.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6">No active zones</p>
        )}
        {sorted.map((zone, idx) => (
          <div
            key={zone._id}
            className="bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-hidden"
          >
            {/* Top row — rank, name, score, actions */}
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
              {/* Rank + color bar */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-600 font-mono text-xs">#{idx + 1}</span>
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ background: getPriorityColor(zone.priorityScore) }}
                />
              </div>

              {/* Name — full width, wraps if needed */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white leading-tight">
                  {zone.name}
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-white leading-none">
                  {zone.priorityScore?.toFixed(1)}
                </div>
                <div className="text-xs text-slate-500">score</div>
              </div>
            </div>

            {/* Bottom row — badges, severity bar, buttons */}
            <div className="flex items-center gap-2 px-3 pb-3 pt-1 flex-wrap">
              {/* Priority badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityBg(zone.priorityScore)}`}>
                {getPriorityLevel(zone.priorityScore).toUpperCase()}
              </span>

              {/* Skill */}
              <span className="text-xs text-slate-400">
                {getSkillIcon(zone.requiredSkill)} {zone.requiredSkill}
              </span>

              {/* People affected */}
              <span className="text-xs text-slate-500">
                {zone.peopleAffected?.toLocaleString()} affected
              </span>

              {/* Severity bar — takes remaining space */}
              <div className="flex-1 min-w-16">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 flex-shrink-0">Sev {zone.severity}/10</span>
                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${zone.severity * 10}%`,
                        background: zone.severity >= 8 ? '#ef4444' : zone.severity >= 5 ? '#f59e0b' : '#3b82f6'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Insight + Delete */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ZoneInsight zone={zone} assignments={assignments} />
                <button
                  onClick={() => handleDelete(zone._id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
