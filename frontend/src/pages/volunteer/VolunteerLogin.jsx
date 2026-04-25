import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogIn, UserPlus, MapPin } from 'lucide-react'

export default function VolunteerLogin() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode,    setMode]    = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phone: '', skill: 'rescue', organization: '',
    lat: '', lng: '',
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('lat', pos.coords.latitude.toFixed(6))
        set('lng', pos.coords.longitude.toFixed(6))
        toast.success('Location detected!')
      },
      () => toast.error('Could not get location')
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        if (!form.name || !form.email || !form.password || !form.skill) {
          toast.error('Please fill all required fields')
          setLoading(false)
          return
        }
        await register({
          ...form,
          lat: parseFloat(form.lat) || 22.7196,
          lng: parseFloat(form.lng) || 75.8577,
        })
        toast.success('Registered successfully!')
      }
      navigate('/volunteer/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚨</div>
          <h1 className="text-2xl font-bold text-white">DisasterRelief</h1>
          <p className="text-slate-400 text-sm mt-1">Volunteer Portal</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1 mb-6">
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  mode === m ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {m === 'login' ? '🔑 Login' : '✍️ Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <input
                  placeholder="Full name *"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  placeholder="Phone number"
                  value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  placeholder="Organization / NGO"
                  value={form.organization} onChange={e => set('organization', e.target.value)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                {/* Skill selector */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Your Skill *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['rescue','medical','logistics'].map(s => (
                      <button key={s} type="button" onClick={() => set('skill', s)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                          form.skill === s
                            ? s === 'rescue' ? 'bg-red-600 border-red-500 text-white'
                            : s === 'medical' ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-slate-900/70 border-slate-700 text-slate-400'
                        }`}
                      >
                        {s === 'rescue' ? '🚨' : s === 'medical' ? '🏥' : '📦'} {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" step="any" placeholder="Latitude"
                    value={form.lat} onChange={e => set('lat', e.target.value)}
                    className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number" step="any" placeholder="Longitude"
                    value={form.lng} onChange={e => set('lng', e.target.value)}
                    className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button type="button" onClick={useMyLocation}
                  className="w-full flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg py-2"
                >
                  <MapPin size={12} /> Use my current location
                </button>
              </>
            )}

            <input
              type="email" placeholder="Email address *"
              value={form.email} onChange={e => set('email', e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password" placeholder="Password *"
              value={form.password} onChange={e => set('password', e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors mt-2"
            >
              {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register & Join'}
            </button>
          </form>

          {/* Admin link */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Go to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
