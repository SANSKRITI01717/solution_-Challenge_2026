import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, WifiOff, Activity, User, LogOut } from 'lucide-react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

const adminLinks = [
  { to: '/',            icon: <LayoutDashboard size={18} />, label: 'Dashboard'    },
  { to: '/volunteers',  icon: <Users size={18} />,           label: 'Volunteers'   },
  { to: '/offline',     icon: <WifiOff size={18} />,         label: 'Offline Mode' },
]

export default function Sidebar() {
  const { connected }          = useSocket()
  const { volunteer, logout }  = useAuth()

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

      {/* Admin nav links */}
      <div className="mb-2">
        <p className="text-xs text-slate-600 uppercase tracking-wider px-2 mb-2">Admin</p>
        <nav className="space-y-1">
          {adminLinks.map(l => (
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
      </div>

      {/* Divider */}
      <div className="border-t border-slate-800 my-3" />

      {/* Volunteer section */}
      <div className="mb-2">
        <p className="text-xs text-slate-600 uppercase tracking-wider px-2 mb-2">Volunteer Portal</p>
        <nav className="space-y-1">
          <NavLink
            to="/volunteer"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <User size={18} />
            {volunteer ? 'My Dashboard' : 'Volunteer Login'}
          </NavLink>
        </nav>
      </div>

      {/* Logged in volunteer info */}
      {volunteer && (
        <div className="mx-2 mb-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-400">{volunteer.name}</div>
              <div className="text-xs text-slate-500">{volunteer.skill}</div>
            </div>
            <button
              onClick={logout}
              className="text-slate-600 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-1.5 h-1.5 rounded-full ${volunteer.available ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-400">
              {volunteer.available ? 'Available' : 'On Mission'}
            </span>
          </div>
        </div>
      )}

      {/* Connection status */}
      <div className="mt-auto px-3 py-3 border-t border-slate-800">
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
