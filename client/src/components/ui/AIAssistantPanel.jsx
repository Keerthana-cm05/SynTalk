import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, Trash2, Volume2, RotateCcw, X } from 'lucide-react'
import { useTTS } from '../../hooks/useTTS'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Debounced AI suggestions
function useAISuggest() {
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const debounceRef = useRef(null)

  const getSuggestions = useCallback((partial) => {
    clearTimeout(debounceRef.current)
    if (!partial?.trim() || partial.trim().length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`${API}/api/ai/suggest`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ partial }),
        })
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 500)
  }, [])

  const clear = useCallback(() => {
    clearTimeout(debounceRef.current)
    setSuggestions([])
    setLoading(false)
  }, [])

  return { suggestions, loading, getSuggestions, clear }
}

async function aiComplete(text) {
  try {
    const res  = await fetch(`${API}/api/ai/complete`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    })
    const data = await res.json()
    return data.completed || text
  } catch {
    return text
  }
}

let msgId = 0

export default function AIAssistantPanel({ gestureText = '' }) {
  const [input,        setInput]        = useState('')
  const [messages,     setMessages]     = useState([])
  const [completing,   setCompleting]   = useState(false)
  const [open,         setOpen]         = useState(true)
  const tts          = useTTS()
  const bottomRef    = useRef(null)
  const prevGesture  = useRef('')
  const { suggestions, loading, getSuggestions, clear } = useAISuggest()

  // When a gesture is recognised — append to input
  useEffect(() => {
    if (!gestureText || gestureText === prevGesture.current) return
    prevGesture.current = gestureText
    setInput(prev => {
      const next = prev ? `${prev} ${gestureText}` : gestureText
      getSuggestions(next)
      return next
    })
  }, [gestureText])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleInputChange(e) {
    const val = e.target.value
    setInput(val)
    getSuggestions(val)
  }

  function handleSelect(suggestion) {
    const next = input.trim()
      ? `${input.trim()} ${suggestion}`
      : suggestion
    setInput(next)
    clear()
    getSuggestions(next)
  }

  function handleSend() {
    if (!input.trim()) return
    const msg = {
      id:   ++msgId,
      text: input.trim(),
      ts:   Date.now(),
    }
    setMessages(prev => [...prev, msg])
    tts.speak(msg.text)
    setInput('')
    clear()
  }

  async function handleComplete() {
    if (!input.trim()) return
    setCompleting(true)
    try {
      const completed = await aiComplete(input)
      setInput(completed)
      clear()
      getSuggestions(completed)
    } finally {
      setCompleting(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="glass-raised rounded-2xl flex flex-col"
      style={{
        border: '1px solid var(--border)',
        height: '100%',
        overflow: 'hidden',
      }}>

      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:28, height:28, borderRadius:8,
            background:'rgba(74,127,165,0.12)',
            border:'1px solid rgba(74,127,165,0.20)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Sparkles size={13} style={{ color:'var(--accent-light)' }}/>
          </div>
          <div>
            <p style={{ fontSize:13.5, color:'var(--text-primary)', fontFamily:'DM Sans', fontWeight:500 }}>
              AI Assistant
            </p>
            <p style={{ fontSize:10.5, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
              Gesture → sentence completion
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            style={{
              width:28, height:28, borderRadius:8, cursor:'pointer',
              background:'rgba(239,68,68,0.08)',
              border:'1px solid rgba(239,68,68,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fca5a5',
            }}>
            <Trash2 size={12}/>
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex:1, overflowY:'auto', padding:'12px 14px',
        display:'flex', flexDirection:'column', gap:8,
        minHeight:0,
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            textAlign:'center', padding:'20px 0',
          }}>
            <div>
              <Sparkles size={22} style={{ color:'var(--text-muted)', margin:'0 auto 8px' }}/>
              <p style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'DM Sans', lineHeight:1.6 }}>
                Recognised gestures appear here.
                <br/>Type or use AI to complete sentences.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity:0, y:8, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                transition={{ duration:0.3 }}
                className="group"
                style={{
                  padding:'10px 12px', borderRadius:10,
                  background:'rgba(74,127,165,0.10)',
                  border:'1px solid rgba(74,127,165,0.18)',
                  display:'flex', alignItems:'flex-start',
                  justifyContent:'space-between', gap:8,
                }}>
                <p style={{ fontSize:14, color:'var(--text-primary)', fontFamily:'DM Sans', lineHeight:1.5, flex:1 }}>
                  {msg.text}
                </p>
                <button
                  onClick={() => tts.speak(msg.text)}
                  style={{
                    width:24, height:24, borderRadius:6, cursor:'pointer',
                    background:'rgba(74,127,165,0.15)',
                    border:'1px solid rgba(74,127,165,0.22)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'var(--accent-light)', flexShrink:0,
                    opacity:0, transition:'opacity 0.2s',
                  }}
                  className="group-hover-show"
                  onMouseEnter={e => e.currentTarget.style.opacity=1}
                  onMouseLeave={e => e.currentTarget.style.opacity=0}
                >
                  <Volume2 size={11}/>
                </button>
              </motion.div>
            ))}
            <div ref={bottomRef}/>
          </>
        )}
      </div>

      {/* AI suggestions */}
      <AnimatePresence>
        {(loading || suggestions.length > 0) && (
          <motion.div
            initial={{ opacity:0, height:0 }}
            animate={{ opacity:1, height:'auto' }}
            exit={{ opacity:0, height:0 }}
            style={{
              borderTop:'1px solid var(--border)',
              padding:'10px 14px',
              overflow:'hidden',
              flexShrink:0,
            }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  width:14, height:14, borderRadius:'50%',
                  border:'2px solid var(--accent)', borderTopColor:'transparent',
                  animation:'spin 0.75s linear infinite',
                }}/>
                <span style={{ fontSize:11.5, color:'var(--text-muted)', fontFamily:'DM Sans' }}>
                  AI thinking…
                </span>
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent-muted)' }}
                    animate={{ opacity:[0.3,1,0.3], y:[0,-3,0] }}
                    transition={{ duration:0.7, delay:i*0.15, repeat:Infinity }}/>
                ))}
              </div>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity:0, scale:0.88 }}
                    animate={{ opacity:1, scale:1 }}
                    transition={{ delay:i*0.04 }}
                    onClick={() => handleSelect(s)}
                    style={{
                      padding:'5px 12px', borderRadius:20, cursor:'pointer',
                      background:'rgba(74,127,165,0.10)',
                      border:'1px solid rgba(74,127,165,0.22)',
                      color:'var(--text-secondary)', fontSize:12.5,
                      fontFamily:'DM Sans', transition:'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background='rgba(74,127,165,0.20)'
                      e.currentTarget.style.color='var(--text-primary)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background='rgba(74,127,165,0.10)'
                      e.currentTarget.style.color='var(--text-secondary)'
                    }}
                  >
                    {input.trim() && (
                      <span style={{ color:'var(--text-muted)', marginRight:4 }}>
                        {input.trim().split(' ').slice(-1)[0]}
                      </span>
                    )}
                    {s}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div style={{
        padding:'12px 14px',
        borderTop:'1px solid var(--border)',
        display:'flex', flexDirection:'column', gap:8,
        flexShrink:0,
      }}>
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Gesture output appears here… or type manually"
          rows={2}
          style={{
            width:'100%', padding:'10px 12px', borderRadius:10,
            background:'rgba(255,255,255,0.04)',
            border:'1px solid var(--border)',
            color:'var(--text-primary)', fontSize:13.5,
            fontFamily:'DM Sans', outline:'none', resize:'none',
            lineHeight:1.6, transition:'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor='rgba(74,127,165,0.45)'}
          onBlur={e  => e.target.style.borderColor='var(--border)'}
        />

        <div style={{ display:'flex', items:'center', gap:7, flexWrap:'wrap' }}>
          {/* AI Complete */}
          <button
            onClick={handleComplete}
            disabled={!input.trim() || completing}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', borderRadius:9, cursor:'pointer',
              background:'rgba(74,127,165,0.10)',
              border:'1px solid rgba(74,127,165,0.20)',
              color:'var(--accent-light)', fontSize:13,
              fontFamily:'DM Sans', opacity: completing ? 0.6 : 1,
              transition:'all 0.2s',
            }}>
            {completing
              ? <RotateCcw size={12} style={{ animation:'spin 1s linear infinite' }}/>
              : <Sparkles size={12}/>
            }
            {completing ? 'Completing…' : 'AI Complete'}
          </button>

          {/* Speak */}
          <button
            onClick={() => tts.speak(input)}
            disabled={!input.trim()}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 14px', borderRadius:9, cursor:'pointer',
              background: tts.speaking ? 'rgba(239,68,68,0.10)' : 'rgba(255,255,255,0.05)',
              border: tts.speaking ? '1px solid rgba(239,68,68,0.22)' : '1px solid var(--border)',
              color: tts.speaking ? '#fca5a5' : 'var(--text-muted)',
              fontSize:13, fontFamily:'DM Sans',
              opacity: !input.trim() ? 0.4 : 1,
            }}>
            <Volume2 size={12}/>
            {tts.speaking ? 'Speaking…' : 'Speak'}
          </button>

          {/* Clear input */}
          {input && (
            <button
              onClick={() => { setInput(''); clear() }}
              style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'7px 12px', borderRadius:9, cursor:'pointer',
                background:'transparent', border:'1px solid var(--border)',
                color:'var(--text-muted)', fontSize:13, fontFamily:'DM Sans',
              }}>
              <X size={11}/> Clear
            </button>
          )}

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'7px 16px', borderRadius:9, cursor:'pointer',
              background: input.trim() ? '#4a7fa5' : 'rgba(74,127,165,0.25)',
              border:'none', color:'#fff', fontSize:13,
              fontFamily:'DM Sans', fontWeight:500,
              marginLeft:'auto',
              boxShadow: input.trim() ? '0 3px 12px rgba(74,127,165,0.25)' : 'none',
              transition:'all 0.2s',
            }}>
            <Send size={12}/> Send
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  )
}