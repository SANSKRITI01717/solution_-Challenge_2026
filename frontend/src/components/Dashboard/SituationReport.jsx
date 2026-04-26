import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Brain, X, AlertTriangle, CheckCircle, TrendingUp, Target, Radio } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  CRITICAL: { text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30' },
  HIGH:     { text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  MODERATE: { text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  STABLE:   { text: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30' },
}

export default function SituationReport({ zones, volunteers, assignments, stats }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [report,  setReport]  = useState(null)
  const [genTime, setGenTime] = useState(null)

  async function fetchReport() {
    setOpen(true)
    setLoading(true)
    setReport(null)
    try {
      const res = await axios.post('/api/gemini/situation-report', {
        zones, volunteers, assignments, stats
      })
      setReport(res.data.report)
      setGenTime(res.data.generatedAt ? new Date(res.data.generatedAt).toLocaleTimeString() : new Date().toLocaleTimeString())
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.error || err.message))
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const style = report ? (STATUS_STYLES[report.overallStatus] || STATUS_STYLES.HIGH) : null

  const modal = open && (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => e.target === e.currentTarget && setOpen(false)}
    >
      <div style={{
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '1rem',
        width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', zIndex: 1,
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem', borderBottom:'1px solid #1e293b' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <div style={{ width:32, height:32, background:'rgba(147,51,234,0.2)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Brain size={16} color="#c084fc" />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'white' }}>AI Situation Report</div>
              <div style={{ fontSize:12, color:'#64748b' }}>{genTime ? `Generated at ${genTime}` : 'Gemini AI Command Briefing'}</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{ color:'#64748b', background:'none', border:'none', cursor:'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'4rem 1rem', gap:'1rem' }}>
            <div style={{ width:40, height:40, border:'2px solid #7c3aed', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            <div style={{ textAlign:'center' }}>
              <div style={{ color:'#e2e8f0', fontSize:14 }}>Gemini is analyzing all zones...</div>
              <div style={{ color:'#64748b', fontSize:12, marginTop:4 }}>Processing {zones.length} zones and {volunteers.length} volunteers</div>
            </div>
          </div>
        )}

        {/* Report content */}
        {report && !loading && (
          <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Overall status */}
            <div style={{ background: report.overallStatus === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)', border: `1px solid ${report.overallStatus === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`, borderRadius:12, padding:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Radio size={16} color={report.overallStatus === 'CRITICAL' ? '#f87171' : '#fb923c'} />
                <span style={{ fontSize:13, fontWeight:700, color: report.overallStatus === 'CRITICAL' ? '#f87171' : '#fb923c', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Overall Status: {report.overallStatus}
                </span>
              </div>
              <p style={{ fontSize:13, color:'#cbd5e1', lineHeight:1.6 }}>{report.executiveSummary}</p>
            </div>

            {/* Top priority */}
            <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <Target size={14} color="#f87171" />
                <span style={{ fontSize:11, fontWeight:600, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.05em' }}>Top Priority Right Now</span>
              </div>
              <p style={{ fontSize:13, color:'#cbd5e1' }}>{report.topPriority}</p>
            </div>

            {/* Two columns */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {/* Resource gaps */}
              <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:12, padding:'0.875rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                  <AlertTriangle size={13} color="#fbbf24" />
                  <span style={{ fontSize:11, fontWeight:600, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em' }}>Resource Gaps</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {report.resourceGaps?.map((gap, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:12, color:'#fcd34d' }}>
                      <span style={{ color:'#f59e0b', flexShrink:0 }}>⚠</span>
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:12, padding:'0.875rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                  <CheckCircle size={13} color="#34d399" />
                  <span style={{ fontSize:11, fontWeight:600, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em' }}>Recommendations</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {report.immediateRecommendations?.map((rec, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6, fontSize:12, color:'#6ee7b7' }}>
                      <span style={{ color:'#10b981', flexShrink:0 }}>→</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Coordination */}
            <div style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:12, padding:'0.875rem' }}>
              <div style={{ fontSize:11, fontWeight:600, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Coordination Notes</div>
              <p style={{ fontSize:13, color:'#cbd5e1' }}>{report.coordinationNotes}</p>
            </div>

            {/* Next 6 hours */}
            <div style={{ background:'rgba(15,23,42,0.8)', border:'1px solid #1e293b', borderRadius:12, padding:'0.875rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <TrendingUp size={13} color="#c084fc" />
                <span style={{ fontSize:11, fontWeight:600, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em' }}>Next 6 Hours Forecast</span>
              </div>
              <p style={{ fontSize:13, color:'#cbd5e1' }}>{report.nextSixHours}</p>
            </div>

            {/* Success metrics */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Success Metrics</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {report.successMetrics?.map((m, i) => (
                  <span key={i} style={{ fontSize:12, background:'#1e293b', color:'#cbd5e1', border:'1px solid #334155', borderRadius:8, padding:'6px 12px' }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid #1e293b' }}>
              <span style={{ fontSize:11, color:'#475569' }}>Powered by Google Gemini AI</span>
              <button onClick={fetchReport} style={{ fontSize:12, color:'#c084fc', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <Brain size={11} /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <>
      <button
        onClick={fetchReport}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg px-4 py-1.5 text-sm transition-colors"
      >
        <Brain size={15} />
        AI Situation Report
      </button>

      {/* Portal renders modal at document.body level — above Leaflet map */}
      {createPortal(modal, document.body)}
    </>
  )
}
