import axios from 'axios'

// const BASE = import.meta.env.VITE_API_URL || "https://disaster-relief-backend-kn9t.onrender.com";

// const api = axios.create({
//   baseURL: `${BASE}/api`,
//   headers: {
//     "Cache-Control": "no-cache"
//   }
// });
const BASE =  import.meta.env.VITE_API_URL || "https://disaster-relief-backend-kn9t.onrender.com";

const api = axios.create({
  baseURL: `${BASE}/api`
});
// ── Zones ──
export const getZones      = ()       => api.get('/zones')
export const createZone    = (data)   => api.post('/zones', data)
export const updateZone    = (id, d)  => api.put(`/zones/${id}`, d)
export const deleteZone    = (id)     => api.delete(`/zones/${id}`)

// ── Volunteers ──
export const getVolunteers    = (params) => api.get('/volunteers', { params })
export const createVolunteer  = (data)   => api.post('/volunteers', data)
export const releaseVolunteer = (id)     => api.patch(`/volunteers/${id}/release`)

// ── Matching ──
export const runMatch           = ()    => api.post('/match')
export const getAssignments     = ()    => api.get('/match')
export const completeAssignment = (id)  => api.patch(`/match/${id}/complete`)

export default api