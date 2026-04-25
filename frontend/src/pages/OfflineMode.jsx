import { useState } from 'react'
import { WifiOff, Play, Download, Upload } from 'lucide-react'
import { getPriorityBg, getPriorityLevel, getSkillIcon } from '../utils/priority'
import toast from 'react-hot-toast'

const SAMPLE = {
  zones: [
    { id:"z1", name:"Flood Zone A", lat:22.7196, lng:75.8577, severity:9, peopleAffected:5000, requiredSkill:"rescue",   needsHelp:true },
    { id:"z2", name:"Earthquake Site", lat:22.725, lng:75.87, severity:8, peopleAffected:2000, requiredSkill:"medical",  needsHelp:true },
    { id:"z3", name:"Fire Zone",    lat:22.71,   lng:75.84,  severity:6, peopleAffected:800,  requiredSkill:"logistics", needsHelp:true },
  ],
  volunteers: [
    { id:"v1", name:"Arjun Mehta",  lat:22.718, lng:75.856, skill:"rescue",    available:true },
    { id:"v2", name:"Priya Sharma", lat:22.726, lng:75.872, skill:"medical",   available:true },
    { id:"v3", name:"Ravi Kumar",   lat:22.709, lng:75.839, skill:"logistics", available:true },
  ],
}

export default function OfflineMode() {
  const [input,   setInput]   = useState(JSON.stringify(SAMPLE, null, 2))
  const [result,  setResult]  = useState(null)
  const [running, setRunning] = useState(false)
  const [error,   setError]   = useState('')

  // In offline mode: POST to local backend (which calls C++ binary directly)
  // If even that's unavailable, show instructions for pure CLI usage
  async function handleRun() {
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const parsed = JSON.parse(input)
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
      toast.success('Engine run complete!')
    } catch (err) {
      // Fallback: simulate locally via JS mirror of the algorithm
      try {
        const parsed = JSON.parse(input)
        const simResult = simulateLocally(parsed)
        setResult(simResult)
        toast('Backend unavailable — running local JS simulation', { icon: '⚠️' })
      } catch (e) {
        setError('Invalid JSON input: ' + e.message)
      }
    } finally {
      setRunning(false)
    }
  }

  // JS mirror of C++ greedy algorithm (offline fallback when no backend)
  function simulateLocally({ zones, volunteers }) {
    const scored = zones.map(z => {
      const pf = z.peopleAffected > 0 ? Math.log(z.peopleAffected + 1) * 0.3 : 0
      return { ...z, priorityScore: z.severity * 0.5 + pf + (z.severity / 10) * 0.2 }
    }).sort((a, b) => b.priorityScore - a.priorityScore)

    const vols = volunteers.map(v => ({ ...v, assignedZoneId: '' }))
    const assignments = []

    for (const zone of scored) {
      if (!zone.needsHelp) continue
      const candidates = vols.filter(v =>
        v.available && (v.skill === zone.requiredSkill || zone.requiredSkill === 'any')
      )
      if (candidates.length === 0) continue
      // Pick nearest
      let best = null, bestDist = Infinity
      for (const v of candidates) {
        const d = Math.sqrt((v.lat - zone.lat) ** 2 + (v.lng - zone.lng) ** 2) * 111
        if (d < bestDist) { bestDist = d; best = v }
      }
      if (best) {
        best.available = false
        best.assignedZoneId = zone.id
        assignments.push({ volunteerId: best.id, zoneId: zone.id, distanceKm: parseFloat(bestDist.toFixed(3)), skill: best.skill })
      }
    }

    return {
      prioritizedZones: scored,
      assignments,
      volunteerStatus: vols,
      stats: { totalZones: zones.length, assignedZones: assignments.length, unmatchedZones: zones.filter(z=>z.needsHelp).length - assignments.length, availableVolunteers: vols.filter(v=>v.available).length }
    }
  }

  function downloadResult() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'allocation_result.json'; a.click()
  }

  function loadFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setInput(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      <div className="flex items-center gap-3 mb-5">
        <WifiOff size={20} className="text-amber-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Offline Mode</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Run the C++ allocation engine locally — no internet required
          </p>
        </div>
        <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1">
          Works without network
        </span>
      </div>

      {/* CLI instructions */}
      <div className="bg-slate-800/60 border border-amber-500/20 rounded-xl p-4 mb-4">
        <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
          Pure CLI Usage (no browser needed)
        </h2>
        <div className="font-mono text-xs text-slate-400 space-y-1">
          <div><span className="text-slate-600"># Compile once</span></div>
          <div className="text-emerald-400">g++ -std=c++17 -O2 -o engine cpp-engine/engine.cpp</div>
          <div className="mt-2"><span className="text-slate-600"># Run with your data file</span></div>
          <div className="text-emerald-400">./engine &lt; my_data.json &gt; result.json</div>
          <div className="mt-2"><span className="text-slate-600"># View result</span></div>
          <div className="text-emerald-400">cat result.json</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">Input JSON</h2>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer border border-slate-700 rounded-lg px-2.5 py-1 transition-colors">
              <Upload size={12} />
              Load file
              <input type="file" accept=".json" onChange={loadFile} className="hidden" />
            </label>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={20}
            className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            spellCheck={false}
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <button
            onClick={handleRun} disabled={running}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
          >
            <Play size={14} className={running ? 'animate-pulse' : ''} />
            {running ? 'Running…' : 'Run Allocation Engine'}
          </button>
        </div>

        {/* Output */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300">Results</h2>
            {result && (
              <button
                onClick={downloadResult}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2.5 py-1 transition-colors"
              >
                <Download size={12} /> Download JSON
              </button>
            )}
          </div>

          {!result && (
            <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
              Run the engine to see results
            </div>
          )}

          {result && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(result.stats || {}).map(([k, v]) => (
                  <div key={k} className="bg-slate-900/70 rounded-lg px-3 py-2">
                    <div className="text-xs text-slate-500 capitalize">{k.replace(/([A-Z])/g,' $1')}</div>
                    <div className="text-lg font-bold text-white">{v}</div>
                  </div>
                ))}
              </div>

              {/* Assignments */}
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-wide mb-2">Assignments</h3>
                <div className="space-y-2">
                  {result.assignments?.map((a, i) => (
                    <div key={i} className="bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getSkillIcon(a.skill)}</span>
                        <span className="text-xs text-slate-300 font-medium">{a.volunteerId}</span>
                        <span className="text-slate-600 text-xs">→</span>
                        <span className="text-xs text-slate-400 flex-1 truncate">{a.zoneId}</span>
                        <span className="text-xs text-slate-500">{a.distanceKm} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority zones */}
              <div>
                <h3 className="text-xs text-slate-400 uppercase tracking-wide mb-2">Priority Order</h3>
                <div className="space-y-1">
                  {result.prioritizedZones?.map((z, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 w-4">#{i+1}</span>
                      <span className="text-white flex-1 truncate">{z.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getPriorityBg(z.priorityScore)}`}>
                        {z.priorityScore?.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
