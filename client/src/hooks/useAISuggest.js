import { useState, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useAISuggest() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)

  const getSuggestions = useCallback((partial) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!partial.trim()) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API}/api/ai/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partial }),
        })
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 600)
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setLoading(false)
  }, [])

  return { suggestions, loading, getSuggestions, clearSuggestions }
}

export async function completeText(text) {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  try {
    const res = await fetch(`${API}/api/ai/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    const data = await res.json()
    return data.completed || text
  } catch {
    return text
  }
}