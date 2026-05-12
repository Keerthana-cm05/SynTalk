import { useState, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useGloveConnect() {
  const [ports,        setPorts]        = useState([])
  const [selectedPort, setSelectedPort] = useState('')
  const [connecting,   setConnecting]   = useState(false)
  const [error,        setError]        = useState('')
  const [scanning,     setScanning]     = useState(false)

  const fetchPorts = useCallback(async () => {
    setScanning(true)
    setError('')
    try {
      const res  = await fetch(`${API}/api/glove/ports`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      const list = data.ports || []
      setPorts(list)

      const arduino = list.find(p => p.isArduino)
      if (arduino) {
        setSelectedPort(arduino.path)
      } else if (list.length > 0) {
        setSelectedPort(list[0].path)
      }

      if (list.length === 0) {
        setError('No serial ports found. Check USB connection.')
      }

      return list
    } catch (err) {
      setError(`Cannot reach server: ${err.message}`)
      return []
    } finally {
      setScanning(false)
    }
  }, [])

  const connectGlove = useCallback(async (port) => {
    if (!port) { setError('Select a port first'); return }
    setConnecting(true)
    setError('')
    try {
      const res  = await fetch(`${API}/api/glove/connect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ port, baudRate: 9600 }),  // ← 9600 to match Arduino
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Connect failed')
    } catch (err) {
      setError(err.message)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnectGlove = useCallback(async () => {
    try {
      await fetch(`${API}/api/glove/disconnect`, { method: 'POST' })
    } catch {}
  }, [])

  return {
    ports,
    fetchPorts,
    scanning,
    selectedPort,
    setSelectedPort,
    connecting,
    connectGlove,
    disconnectGlove,
    error,
    setError,
  }
}