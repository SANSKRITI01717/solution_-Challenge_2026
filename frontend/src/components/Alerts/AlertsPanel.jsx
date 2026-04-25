import { useEffect, useState } from 'react'
import { useSocket } from '../../context/SocketContext'
import { Bell, Wifi, WifiOff, Zap } from 'lucide-react'

export default function AlertsPanel() {
  const { connected, lastMatch, simTick } = useSocket()
  const [alerts, setAlerts] = useState([])

  function addAlert(type, message) {
    const alert = { id: Date.now(), type, message, time: new Date().toLocaleTimeString() }
    setAlerts(prev => [alert, ...prev].slice(0, 20))
  }

  useEffect(() => {
    if (lastMatch) {
      addAlert('success', `Matching complete: ${lastMatch.assignments?.length || 0} assignments made`)
      lastMatch.assignments?.forEach(a => {
        addAlert('assignment', `Volunteer assigned → ${a.zoneId || 'zone'}`)
      })
    }
  }, [lastMatch])

  useEffect(() => {
    if (simTick) {
      const top = simTick.prioritizedZones?.[0]
      if (top) addAlert('sim', `Simulation: "${top.name}" — priority ${top.priorityScore?.toFixed(2)}`)
    }
  }, [simTick])

  const typeStyle = {
    success:    'border-l-2 border-emerald-500 bg-emerald-500/5',
    assignment: 'border-l-2 border-blue-500 bg-blue-500/5',
    sim:        'border-l-2 border-amber-500 bg-amber-500/5',
    warning:    'border-l-2 border-red-500 bg-red-500/5',
  }

  const typeIcon = {
    success:    '✅',
    assignment: '📌',
    sim:        '🔄',
    warning:    '🚨',
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Live Alerts</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Online' : 'Offline'}
        </div>
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8">
          <Zap size={24} className="text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Alerts will appear here</p>
          <p className="text-slate-600 text-xs mt-1">Run matching to see live updates</p>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {alerts.map(alert => (
          <div key={alert.id} className={`rounded-lg px-3 py-2 ${typeStyle[alert.type] || typeStyle.success}`}>
            <div className="flex items-start gap-2">
              <span className="text-sm flex-shrink-0">{typeIcon[alert.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300">{alert.message}</p>
                <p className="text-xs text-slate-600 mt-0.5">{alert.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
