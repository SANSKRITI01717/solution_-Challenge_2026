import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, AlertTriangle, Clock, Users, Package, TrendingUp, Zap } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const RISK_COLORS = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HIGH:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  MEDIUM:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  LOW:      'text-green-400 bg-green-500/10 border-green-500/30',
}

export default function ZoneInsight({ zone, assignments }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState(null)

  async function fetchInsight() {
    setOpen(true)
    if (insight) return // already loaded
    setLoading(true)
    try {
      const res = await axios.post('/api/gemini/zone-insight', {
        zone,
        assignments: assignments?.filter(a =>
          a.zoneId?._id === zone._id || a.zoneId === zone._id
        )
      })
      setInsight(res.data.insight)
    } catch (err) {
      toast.error('Gemini API error: ' + (err.response?.data?.error || err.message))
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={fetchInsight}
        className="flex items-center gap-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg px-2.5 py-1.5 transition-all"
        title="Get AI Insights"
      >
        <Sparkles size={12} />
        AI Insight
      </button>

      {/* Modal via Portal — renders above Leaflet map */}
      {open && createPortal(
        <div
          style={{ position:'fixed', inset:0, zIndex:999999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">AI Situation Insight</h2>
                  <p className="text-xs text-slate-500">{zone.name}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Gemini is analyzing the situation...</p>
              </div>
            )}

            {/* Content */}
            {insight && !loading && (
              <div className="p-5 space-y-4">
                {/* Risk level + time */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${RISK_COLORS[insight.riskLevel] || RISK_COLORS.HIGH}`}>
                    {insight.riskLevel}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-amber-400">
                    <Clock size={12} />
                    {insight.timeToAct}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30">
                  <p className="text-sm text-slate-300 leading-relaxed">{insight.situationSummary}</p>
                </div>

                {/* Immediate Actions */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-red-400" />
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Immediate Actions</h3>
                  </div>
                  <div className="space-y-1.5">
                    {insight.immediateActions?.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-red-400 font-bold flex-shrink-0">{i + 1}.</span>
                        {action}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplies */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={14} className="text-blue-400" />
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Supplies Needed</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insight.suppliesNeeded?.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-2.5 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Volunteer adequacy */}
                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={13} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Volunteer Status</span>
                  </div>
                  <p className="text-sm text-slate-300">{insight.volunteerAdequacy}</p>
                </div>

                {/* Prediction */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={13} className="text-red-400" />
                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">If No Action Taken</span>
                  </div>
                  <p className="text-sm text-red-300">{insight.prediction}</p>
                </div>

                {/* Powered by */}
                <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-slate-700/50">
                  <Sparkles size={11} className="text-purple-400" />
                  <span className="text-xs text-slate-600">Powered by Google Gemini AI</span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
