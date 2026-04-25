import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  MapPin, CheckCircle, LogOut, User, Sparkles,
  AlertTriangle, Clock, Shield, Package, Phone,
  RefreshCw, Navigation
} from 'lucide-react'
import { getSkillIcon, getSkillColor, getPriorityBg } from '../../utils/priority'

export default function VolunteerDashboard() {
  const { volunteer, logout, refreshMe } = useAuth()
  const { socket }                       = useSocket()
  const navigate                         = useNavigate()

  const [aiReport,    setAiReport]    = useState(null)
  const [loadingAI,   setLoadingAI]   = useState(false)
  const [completing,  setCompleting]  = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)

  const zone = volunteer?.assignedZoneId // populated zone object or null

  // Listen for assignment via socket
  useEffect(() => {
    if (!socket) return
    socket.on('match:complete', async () => {
      toast('📌 New assignment may be available — refreshing...', { duration: 3000 })
      await handleRefresh()
    })
    socket.on('volunteer:released', async (data) => {
      if (data.volunteerId === volunteer?._id) {
        await handleRefresh()
      }
    })
    return () => { socket.off('match:complete'); socket.off('volunteer:released') }
  }, [socket, volunteer])

  // Auto fetch AI report when assigned
  useEffect(() => {
    if (zone && !aiReport) fetchAIReport()
  }, [zone])

  async function handleRefresh() {
    setRefreshing(true)
    try { await refreshMe() }
    catch { toast.error('Failed to refresh') }
    finally { setRefreshing(false) }
  }

  async function fetchAIReport() {
    if (!zone) return
    setLoadingAI(true)
    try {
      const res = await axios.post('/api/gemini/zone-insight', {
        zone: {
          _id:            zone._id,
          name:           zone.name,
          severity:       zone.severity,
          peopleAffected: zone.peopleAffected,
          requiredSkill:  zone.requiredSkill,
          priorityScore:  zone.priorityScore,
        },
        assignments: []
      })
      setAiReport(res.data.insight)
    } catch (err) {
      toast.error('Could not load AI report')
    } finally {
      setLoadingAI(false)
    }
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      await axios.patch('/api/auth/complete-task')
      toast.success('✅ Task marked complete! You are now available.')
      setAiReport(null)
      await refreshMe()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete task')
    } finally {
      setCompleting(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/volunteer/login')
  }

  if (!volunteer) return null

  return (
    <div className="min-h-screen bg-slate-900 p-4 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
            <User size={18} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{volunteer.name}</div>
            <div className={`text-xs px-2 py-0.5 rounded-full inline-block mt-0.5 ${getSkillColor(volunteer.skill)}`}>
              {getSkillIcon(volunteer.skill)} {volunteer.skill}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2 text-slate-500 hover:text-white border border-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-2 transition-colors"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl p-4 mb-4 border ${
        volunteer.available
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${volunteer.available ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
          <span className={`text-sm font-semibold ${volunteer.available ? 'text-emerald-400' : 'text-red-400'}`}>
            {volunteer.available ? 'Available — Ready for Assignment' : 'Currently On Mission'}
          </span>
        </div>
        {volunteer.organization && (
          <p className="text-xs text-slate-400 mt-1 ml-5">{volunteer.organization}</p>
        )}
      </div>

      {/* NO ASSIGNMENT STATE */}
      {volunteer.available && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="text-white font-semibold mb-2">Waiting for Assignment</h2>
          <p className="text-slate-400 text-sm">
            You will be notified here as soon as the system assigns you to a disaster zone.
          </p>
          <p className="text-slate-500 text-xs mt-3">
            The coordination team is running the allocation engine to find the best match for your skills.
          </p>
        </div>
      )}

      {/* ASSIGNMENT CARD */}
      {!volunteer.available && zone && (
        <div className="space-y-4">

          {/* Zone details */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Your Assignment</div>
                <h2 className="text-lg font-bold text-white">{zone.name}</h2>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBg(zone.priorityScore)}`}>
                Priority {zone.priorityScore?.toFixed(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">Severity</div>
                <div className="text-xl font-bold text-red-400">{zone.severity}<span className="text-sm text-slate-500">/10</span></div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3">
                <div className="text-xs text-slate-500 mb-1">People Affected</div>
                <div className="text-xl font-bold text-amber-400">{zone.peopleAffected?.toLocaleString()}</div>
              </div>
            </div>

            {/* Location link */}
            <a
              href={`https://www.google.com/maps?q=${zone.lat},${zone.lng}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl px-4 py-2.5 text-sm text-blue-400 transition-colors w-full justify-center mb-3"
            >
              <Navigation size={14} />
              Open in Google Maps — Get Directions
            </a>

            {/* Complete button */}
            <button
              onClick={handleComplete} disabled={completing}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-colors"
            >
              <CheckCircle size={16} />
              {completing ? 'Marking complete...' : 'Mark Task Complete — I am Done'}
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Only click when you have fully completed your mission at this zone
            </p>
          </div>

          {/* AI Report for volunteer */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">AI Field Report</h3>
                <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5">
                  {getSkillIcon(volunteer.skill)} {volunteer.skill} focused
                </span>
              </div>
              <button onClick={fetchAIReport} className="text-xs text-slate-500 hover:text-purple-400">
                <RefreshCw size={12} />
              </button>
            </div>

            {loadingAI && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400">Generating field report...</span>
              </div>
            )}

            {aiReport && !loadingAI && (
              <div className="space-y-3">
                {/* Summary */}
                <p className="text-sm text-slate-300 leading-relaxed">{aiReport.situationSummary}</p>

                {/* Immediate actions */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Your Immediate Actions</span>
                  </div>
                  <div className="space-y-1.5">
                    {aiReport.immediateActions?.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-red-400 font-bold flex-shrink-0">{i+1}.</span>
                        {a}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplies */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Package size={12} className="text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Supplies to Carry</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiReport.suppliesNeeded?.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-2 py-0.5">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2">
                  <Clock size={12} />
                  <span>{aiReport.timeToAct}</span>
                </div>
              </div>
            )}
          </div>

          {/* Emergency contacts */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone size={14} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Emergency Contacts</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'NDRF Control Room', number: '011-24363260' },
                { label: 'National Emergency',  number: '112' },
                { label: 'Ambulance',           number: '108' },
                { label: 'Fire Brigade',        number: '101' },
              ].map(c => (
                <div key={c.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{c.label}</span>
                  <a href={`tel:${c.number}`} className="text-xs font-mono text-emerald-400 hover:text-emerald-300">
                    {c.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
