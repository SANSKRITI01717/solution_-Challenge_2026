import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [volunteer, setVolunteer] = useState(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vol_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      axios.get('/api/auth/me')
        .then(res => setVolunteer(res.data))
        .catch(() => { localStorage.removeItem('vol_token'); delete axios.defaults.headers.common['Authorization'] })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const res = await axios.post('/api/auth/login', { email, password })
    localStorage.setItem('vol_token', res.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    setVolunteer(res.data.volunteer)
    return res.data.volunteer
  }

  async function register(data) {
    const res = await axios.post('/api/auth/register', data)
    localStorage.setItem('vol_token', res.data.token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
    setVolunteer(res.data.volunteer)
    return res.data.volunteer
  }

  async function refreshMe() {
    const res = await axios.get('/api/auth/me')
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
