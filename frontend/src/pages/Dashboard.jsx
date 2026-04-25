import { useState, useEffect, useCallback } from 'react'
import { getZones, getVolunteers, getAssignments, runMatch } from '../utils/api'
import { useSocket } from '../context/SocketContext'
import StatsRow from '../components/Dashboard/StatsRow'
import ZoneList from '../components/Dashboard/ZoneList'
import AssignmentList from '../components/Dashboard/AssignmentList'
import AnalyticsCharts from '../components/Dashboard/AnalyticsCharts'
import DisasterMap from '../components/Map/DisasterMap'
import AlertsPanel from '../components/Alerts/AlertsPanel'
import AddZoneForm from '../components/Forms/AddZoneForm'
import SituationReport from '../components/Dashboard/SituationReport'
import { Zap, RefreshCw, PlusCircle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { simTick } = useSocket()
  const [zones,       setZones]       = useState([])
  const [volunteers,  setVolunteers]  = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [matching,    setMatching]    = useState(false)
  const [showAddZone, setShowAddZone] = useState(false)
  const [activeTab,   setActiveTab]   = useState('map') // map | analytics

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [z, v, a] = await Promise.all([
        getZones(), getVolunteers(), getAssignments()
      ])
      setZones(z.data)
      setVolunteers(v.data)
      setAssignments(a.data)
    } catch {
      toast.error('Failed to fetch data — check if backend is running')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Refresh on simulation tick
  useEffect(() => { if (simTick) fetchAll() }, [simTick, fetchAll])

  async function handleMatch() {
    setMatching(true)
    try {
      const res = await runMatch()
      toast.success(`C++ engine: ${res.data.stats.assignedZones} zones matched!`)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Matching failed')
    } finally {
      setMatching(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚨</span> DisasterRelief
            <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full ml-1">
              C++ Engine
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Smart Resource Allocation — Real-time Volunteer Coordination</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddZone(v => !v)}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white border border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            <PlusCircle size={14} />
            Add Zone
          </button>
          <SituationReport zones={zones} volunteers={volunteers} assignments={assignments} stats={{ totalZones: zones.length, assignedZones: assignments.filter(a=>a.status==='active').length, availableVolunteers: volunteers.filter(v=>v.available).length }} />
          <button
            onClick={handleMatch} disabled={matching}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-1.5 text-sm transition-colors"
          >
            <Zap size={14} className={matching ? 'animate-pulse' : ''} />
            {matching ? 'Running Engine…' : 'Run Matching'}
          </button>
        </div>
      </div>

      {/* Add zone form (collapsible) */}
      {showAddZone && (
        <div className="mb-4">
          <AddZoneForm onSuccess={() => { fetchAll(); setShowAddZone(false) }} onClose={() => setShowAddZone(false)} />
        </div>
      )}

      {/* Stats */}
      <StatsRow zones={zones} volunteers={volunteers} assignments={assignments} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Left column — map + tabs */}
        <div className="xl:col-span-2 space-y-4">

          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit">
            {['map','analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-medium px-4 py-1.5 rounded-lg capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'map' ? '🗺 Map View' : '📊 Analytics'}
              </button>
            ))}
          </div>

          {activeTab === 'map' ? (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden" style={{ height: 440 }}>
              <DisasterMap zones={zones} volunteers={volunteers} assignments={assignments} />
            </div>
          ) : (
            <AnalyticsCharts zones={zones} volunteers={volunteers} />
          )}

          {/* Assignments */}
          <AssignmentList assignments={assignments} onRefresh={fetchAll} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <ZoneList zones={zones} assignments={assignments} onRefresh={fetchAll} />
          <AlertsPanel />

          {/* Volunteer quick list */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Volunteers</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {volunteers.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No volunteers registered</p>
              )}
              {volunteers.map(v => (
                <div key={v._id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.available ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="text-slate-300 flex-1 truncate">{v.name}</span>
                  <span className="text-slate-500 text-xs">{v.skill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
