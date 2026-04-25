import { useState } from 'react'
import { createZone } from '../../utils/api'
import toast from 'react-hot-toast'
import { PlusCircle, X } from 'lucide-react'

const DEFAULTS = {
  name: '', lat: '', lng: '',
  severity: 5, peopleAffected: 100,
  requiredSkill: 'rescue', description: '',
}

export default function AddZoneForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.lat || !form.lng) {
      return toast.error('Name, latitude, and longitude are required')
    }
    setLoading(true)
    try {
      await createZone({
        ...form,
        lat:            parseFloat(form.lat),
        lng:            parseFloat(form.lng),
        severity:       parseInt(form.severity),
        peopleAffected: parseInt(form.peopleAffected),
      })
      toast.success(`Zone "${form.name}" added!`)
      setForm(DEFAULTS)
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add zone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Report Disaster Zone
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Zone name (e.g. Flood Zone A – Riverside)"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number" step="any" placeholder="Latitude (e.g. 22.7196)"
            value={form.lat} onChange={e => set('lat', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <input
            type="number" step="any" placeholder="Longitude (e.g. 75.8577)"
            value={form.lng} onChange={e => set('lng', e.target.value)}
            className="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Severity: {form.severity}/10</label>
            <input
              type="range" min="1" max="10" value={form.severity}
              onChange={e => set('severity', e.target.value)}
              className="w-full accent-red-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">People affected</label>
            <input
              type="number" value={form.peopleAffected}
              onChange={e => set('peopleAffected', e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Required skill</label>
          <select
            value={form.requiredSkill} onChange={e => set('requiredSkill', e.target.value)}
            className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="rescue">🚨 Rescue</option>
            <option value="medical">🏥 Medical</option>
            <option value="logistics">📦 Logistics</option>
            <option value="any">⚡ Any</option>
          </select>
        </div>

        <textarea
          placeholder="Description (optional)"
          value={form.description} onChange={e => set('description', e.target.value)}
          rows={2}
          className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
        >
          <PlusCircle size={16} />
          {loading ? 'Adding...' : 'Add Disaster Zone'}
        </button>
      </form>
    </div>
  )
}
