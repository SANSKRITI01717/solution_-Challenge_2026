import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [lastMatch, setLastMatch] = useState(null)
  const [simTick, setSimTick]     = useState(null)

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect',    () => { setConnected(true);  toast.success('Live connection established') })
    socket.on('disconnect', () => { setConnected(false); toast.error('Connection lost — offline mode') })

    socket.on('match:complete', (data) => {
      setLastMatch(data)
      toast.success(`✅ ${data.assignments?.length || 0} volunteers assigned!`, { duration: 4000 })
    })

    socket.on('zone:new', (zone) => {
      toast.error(`🚨 New disaster zone: ${zone.name}`, { duration: 5000 })
    })

    socket.on('simulation:tick', (data) => {
      setSimTick(data)
    })

    socket.on('volunteer:registered', (vol) => {
      toast.success(`👤 ${vol.name} registered as ${vol.skill}`)
    })

    socket.on('assignment:completed', (a) => {
      toast.success('✔ Assignment completed')
    })

    socket.on('volunteer:released', (data) => {
      toast.success(`🟢 ${data.message || 'Volunteer now available'}`, { duration: 4000 })
    })

    return () => socket.disconnect()
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, lastMatch, simTick }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
