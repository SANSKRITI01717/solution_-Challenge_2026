import { useState, useEffect } from 'react'
import { getVolunteers, releaseVolunteer } from '../utils/api'
import RegisterVolunteerForm from '../components/Forms/RegisterVolunteerForm'
import { getSkillIcon, getSkillColor } from '../utils/priority'
import { RefreshCw, Unlock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [loading,    setLoading]    = useState(false)

  async function fetchVolunteers() {
    setLoading(true)
    try {
      const res = await getVolunteers()
      setVolunteers(res.data)
    } catch { toast.error('Failed to fetch volunteers') }
    finally  { setLoading(false) }
  }

  useEffect(() => { fetchVolunteers() }, [])

  async function handleRelease(id) {
    try {
      await releaseVolunteer(id)
      toast.success('Volunteer released back to available pool')
      fetchVolunteers()
    } catch { toast.error('Failed to release volunteer') }
  }

  const available = volunteers.filter(v => v.available)
  const assigned  = volunteers.filter(v => !v.available)

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">👥 Volunteer Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Register, view, and manage volunteer assignments</p>
        </div>
        <button
          onClick={fetchVolunteers} disabled={loading}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Registration form */}
        <RegisterVolunteerForm onSuccess={fetchVolunteers} />

        {/* Available volunteers */}
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Available ({available.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {available.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">No available volunteers</p>
              )}
              {available.map(v => (
                <div key={v._id} className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{v.name}</div>
                    {v.organization && <div className="text-xs text-slate-500">{v.organization}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSkillColor(v.skill)}`}>
                    {getSkillIcon(v.skill)} {v.skill}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned volunteers */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              Currently Assigned ({assigned.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {assigned.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">No assigned volunteers</p>
              )}
              {assigned.map(v => (
                <div key={v._id} className="flex items-center gap-3 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/30">
                  <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{v.name}</div>
                    <div className="text-xs text-slate-500">
                      → {v.assignedZoneId?.name || 'Assigned zone'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSkillColor(v.skill)}`}>
                    {v.skill}
                  </span>
                  <button
                    onClick={() => handleRelease(v._id)}
                    className="text-slate-600 hover:text-emerald-400 transition-colors flex-shrink-0"
                    title="Release volunteer"
                  >
                    <Unlock size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
