import { useState, useCallback, useRef, useEffect } from 'react'

export function useTTS() {
  const [speaking,      setSpeaking]      = useState(false)
  const [voices,        setVoices]        = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const mountedRef  = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadVoices = useCallback(() => {
    if (!window.speechSynthesis) return
    const v = window.speechSynthesis.getVoices()
    if (v.length && mountedRef.current) {
      setVoices(v)
      if (!selectedVoice) {
        const preferred =
          v.find(x => x.name.includes('Google') && x.lang.startsWith('en')) ||
          v.find(x => x.lang === 'en-US') ||
          v.find(x => x.lang.startsWith('en')) ||
          v[0]
        setSelectedVoice(preferred || null)
      }
    }
  }, [selectedVoice])

  useEffect(() => {
    if (!window.speechSynthesis) return
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [loadVoices])

  const speak = useCallback((text) => {
    if (!text?.trim() || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u      = new SpeechSynthesisUtterance(text)
    u.voice      = selectedVoice
    u.rate       = 0.92
    u.pitch      = 1.0
    u.volume     = 1.0
    u.onstart    = () => { if (mountedRef.current) setSpeaking(true)  }
    u.onend      = () => { if (mountedRef.current) setSpeaking(false) }
    u.onerror    = () => { if (mountedRef.current) setSpeaking(false) }
    window.speechSynthesis.speak(u)
  }, [selectedVoice])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (mountedRef.current) setSpeaking(false)
  }, [])

  return {
    speak, stop, speaking,
    voices, selectedVoice, setSelectedVoice, loadVoices,
  }
}