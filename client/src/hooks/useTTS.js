import { useState, useCallback, useRef, useEffect } from 'react'

export function useTTS() {
  const [speaking,       setSpeaking]       = useState(false)
  const [voices,         setVoices]         = useState([])
  const [selectedVoice,  setSelectedVoice]  = useState(null)
  const mountedRef   = useRef(false)
  const utteranceRef = useRef(null)

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
        const eng = v.find(x => x.lang.startsWith('en')) || v[0]
        setSelectedVoice(eng)
      }
    }
  }, [selectedVoice])

  useEffect(() => {
    if (!window.speechSynthesis) return
    // Load voices immediately + on change
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [loadVoices])

  const speak = useCallback((text) => {
    if (!text?.trim() || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance      = new SpeechSynthesisUtterance(text)
    utterance.voice      = selectedVoice
    utterance.rate       = 0.95
    utterance.pitch      = 1.0
    utterance.volume     = 1.0
    utterance.onstart    = () => { if (mountedRef.current) setSpeaking(true)  }
    utterance.onend      = () => { if (mountedRef.current) setSpeaking(false) }
    utterance.onerror    = () => { if (mountedRef.current) setSpeaking(false) }
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [selectedVoice])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (mountedRef.current) setSpeaking(false)
  }, [])

  return { speak, stop, speaking, voices, selectedVoice, setSelectedVoice, loadVoices }
}