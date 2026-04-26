import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }) {
  const [volunteer, setVolunteer] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vol_token')
    if (token) {
      axios.get(`${BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setVolunteer(res.data)
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        })
        .catch(() => {
          localStorage.removeItem('vol_token')
          delete axios.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const res = await axios.post(`${BASE}/api/auth/login`, { email, password })
    localStorage.setItem('vol_token', res.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    setVolunteer(res.data.volunteer)
    return res.data.volunteer
  }

  async function register(data) {
    const res = await axios.post(`${BASE}/api/auth/register`, data)
    localStorage.setItem('vol_token', res.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    setVolunteer(res.data.volunteer)
    return res.data.volunteer
  }

  async function refreshMe() {
    const token = localStorage.getItem('vol_token')
    const res = await axios.get(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setVolunteer(res.data)
    return res.data
  }

  function logout() {
    localStorage.removeItem('vol_token')
    delete axios.defaults.headers.common['Authorization']
    setVolunteer(null)
  }

  return (
    <AuthContext.Provider value={{ volunteer, loading, login, register, logout, refreshMe, setVolunteer }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
