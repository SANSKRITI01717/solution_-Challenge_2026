import { useState } from 'react'
import { createVolunteer } from '../../utils/api'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

const DEFAULTS = {
  name: '', email: '', phone: '',
  lat: '', lng: '', skill: 'rescue', organization: '',
}

export default function RegisterVolunteerForm({ onSuccess }) {
  const [form, setForm]       = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        set('lat', pos.coords.latitude.toFixed(6))
        set('lng', pos.coords.longitude.toFixed(6))
        setLocating(false)
        toast.success('Location detected!')
      },
      () => { toast.error('Could not get location'); setLocating(false) }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.lat || !form.lng || !form.skill) {
      return toast.error('Name, location, and skill are required')
    }
    setLoading(true)
    try {
      await createVolunteer({
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      })
      toast.success(`${form.name} registered successfully!`)
      setForm(DEFAULTS)
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">
        Register as Volunteer
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Full name *"
            value={form.name} onChange={e => set('name', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            placeholder="Organization"
            value={form.organization} onChange={e => set('organization', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="email" placeholder="Email"
            value={form.email} onChange={e => set('email', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            placeholder="Phone"
            value={form.phone} onChange={e => set('phone', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Skill *</label>
          <div className="grid grid-cols-3 gap-2">
            {['rescue','medical','logistics'].map(s => (
              <button
                key={s} type="button"
                onClick={() => set('skill', s)}
                className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                  form.skill === s
                    ? s === 'rescue'    ? 'bg-red-600 border-red-500 text-white'
                    : s === 'medical'   ? 'bg-blue-600 border-blue-500 text-white'
                    :                    'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-900/70 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {s === 'rescue' ? '🚨' : s === 'medical' ? '🏥' : '📦'} {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number" step="any" placeholder="Latitude *"
            value={form.lat} onChange={e => set('lat', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="number" step="any" placeholder="Longitude *"
            value={form.lng} onChange={e => set('lng', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="button" onClick={useMyLocation} disabled={locating}
          className="w-full text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg py-2 transition-colors"
        >
          {locating ? 'Detecting...' : '📍 Use my current location'}
        </button>

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
        >
          <UserPlus size={16} />
          {loading ? 'Registering...' : 'Register Volunteer'}
        </button>
      </form>
    </div>
  )
}
