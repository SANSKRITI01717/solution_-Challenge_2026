import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { SocketProvider } from './context/SocketContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Volunteers from './pages/Volunteers'
import OfflineMode from './pages/OfflineMode'
import VolunteerLogin from './pages/volunteer/VolunteerLogin'
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard'

// Protected route — only logged in volunteers
function ProtectedVolunteer({ children }) {
  const { volunteer, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return volunteer ? children : <Navigate to="/volunteer/login" />
}

// Admin layout with sidebar
function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/offline"    element={<OfflineMode />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Volunteer portal routes */}
          <Route path="/volunteer/login"     element={<VolunteerLogin />} />
          <Route path="/volunteer/dashboard" element={
            <ProtectedVolunteer>
              <VolunteerDashboard />
            </ProtectedVolunteer>
          } />

          {/* Admin dashboard routes */}
          <Route path="/*" element={<AdminLayout />} />
        </Routes>

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
