import { getSkillIcon, getSkillColor } from '../../utils/priority'
import { CheckCircle, MapPin } from 'lucide-react'
import { completeAssignment } from '../../utils/api'
import toast from 'react-hot-toast'

export default function AssignmentList({ assignments, onRefresh }) {
  const active = assignments.filter(a => a.status === 'active')

  async function handleComplete(id) {
    try {
      await completeAssignment(id)
      toast.success('Assignment marked complete — volunteer released')
      onRefresh()
    } catch {
      toast.error('Failed to complete assignment')
    }
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
        Active Assignments
      </h2>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {active.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6">No active assignments — run matching to assign</p>
        )}
        {active.map(a => {
          const volName  = a.volunteerId?.name  || 'Volunteer'
          const zoneName = a.zoneId?.name       || 'Zone'
          const skill    = a.volunteerId?.skill || a.skill || 'rescue'
          return (
            <div
              key={a._id}
              className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/30"
            >
              <span className="text-lg">{getSkillIcon(skill)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{volName}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-slate-500" />
                  <span className="text-xs text-slate-400 truncate">{zoneName}</span>
                  <span className="text-xs text-slate-600 ml-1">
                    {a.distanceKm ? `${a.distanceKm.toFixed(2)} km` : ''}
                  </span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getSkillColor(skill)}`}>
                {skill}
              </span>
              <button
                onClick={() => handleComplete(a._id)}
                className="text-slate-600 hover:text-emerald-400 transition-colors flex-shrink-0"
                title="Mark complete"
              >
                <CheckCircle size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
