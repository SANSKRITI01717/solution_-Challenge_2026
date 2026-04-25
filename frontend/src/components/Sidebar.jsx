import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, WifiOff, Activity } from 'lucide-react'
import { useSocket } from '../context/SocketContext'

const links = [
  { to: '/',         icon: <LayoutDashboard size={18} />, label: 'Dashboard'    },
  { to: '/volunteers',icon: <Users size={18} />,          label: 'Volunteers'   },
  { to: '/offline',  icon: <WifiOff size={18} />,         label: 'Offline Mode' },
]

export default function Sidebar() {
  const { connected } = useSocket()

  return (
    <aside className="w-56 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col px-3 py-5 flex-shrink-0">
      {/* Logo */}
      <div className="px-2 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          <div>
            <div className="text-sm font-bold text-white">DisasterRelief</div>
            <div className="text-xs text-slate-500">Resource Allocator</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="space-y-1 flex-1">
        {links.map(l => (
          <NavLink
            key={l.to} to={l.to} end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            {l.icon}
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* Connection status */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Activity size={14} className={connected ? 'text-emerald-400' : 'text-slate-600'} />
          <div>
            <div className={`text-xs font-medium ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {connected ? 'Live' : 'Offline'}
            </div>
            <div className="text-xs text-slate-600">C++ Engine active</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
