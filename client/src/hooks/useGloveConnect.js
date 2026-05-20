import { useState, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useGloveConnect() {
  const [ports,        setPorts]        = useState([])
  const [selectedPort, setSelectedPort] = useState('')
  const [connecting,   setConnecting]   = useState(false)
  const [scanning,     setScanning]     = useState(false)
  const [error,        setError]        = useState('')

  const fetchPorts = useCallback(async (autoConnect = false) => {
    setScanning(true)
    setError('')
    try {
      const r    = await fetch(`${API}/api/glove/ports`)
      const data = await r.json()
      const list = data.ports || []
      setPorts(list)
      const best = list.find(p => p.isArduino) || list[0]
      if (best) {
        setSelectedPort(best.path)
        // Auto-connect to Arduino if requested
        if (autoConnect && best.isArduino) {
          setTimeout(() => connectGlove(best.path), 500)
        }
      }
      if (list.length === 0) setError('No ports found. Check USB cable.')
      return list
    } catch {
      setError('Cannot reach server. Is it running?')
      return []
    } finally {
      setScanning(false)
    }
  }, [])

  const connectGlove = useCallback(async (portArg = null) => {
    const port = portArg || selectedPort
    if (!port) { setError('Select a port first.'); return false }
    setConnecting(true)
    setError('')
    try {
      const r    = await fetch(`${API}/api/glove/connect`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ port, baudRate: 9600 }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Connect failed'); return false }
      console.log('✅ Glove connected:', port)
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setConnecting(false)
    }
  }, [selectedPort])

  const disconnectGlove = useCallback(async () => {
    try { await fetch(`${API}/api/glove/disconnect`, { method: 'POST' }) } catch {}
  }, [])

  return {
    ports, fetchPorts, scanning,
    selectedPort, setSelectedPort,
    connecting, connectGlove, disconnectGlove,
    error, setError,
  }
}