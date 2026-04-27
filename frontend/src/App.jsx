import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { SocketProvider } from './context/SocketContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Volunteers from './pages/Volunteers'
import OfflineMode from './pages/OfflineMode'
import VolunteerLogin from './pages/volunteer/VolunteerLogin'
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard'

// Main layout — sidebar + content (used for ALL pages)
function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

// Volunteer page — shows login OR dashboard depending on auth
function VolunteerPage() {
  const { volunteer, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-full py-20">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // If logged in show dashboard, else show login
  return volunteer ? <VolunteerDashboard /> : <VolunteerLogin />
}

export default function App() {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  
  useEffect(() => {
    // Keep Render backend awake — pings every 10 minutes
    const ping = () => fetch(`${BASE}/api/health`).catch(() => {})
    ping()
    const timer = setInterval(ping, 10 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout>
          <Routes>
            {/* Admin routes */}
            <Route path="/"           element={<Dashboard />} />
            <Route path="/volunteers" element={<Volunteers />} />
            <Route path="/offline"    element={<OfflineMode />} />

            {/* Volunteer portal — same sidebar, same layout */}
            <Route path="/volunteer"  element={<VolunteerPage />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontSize: 13,
            },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  )
}
