import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }  from '../../context/AuthContext'
import { db }       from '../../firebase/config'
import {
  collection, query, orderBy,
  limit, getDocs, deleteDoc, doc
} from 'firebase/firestore'
import {
  History, Volume2, Trash2,
  Clock, MessageSquare, Download,
} from 'lucide-react'
import { useTTS }           from '../../hooks/useTTS'
import { HistorySkeleton }  from '../../components/ui/Skeleton'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
}

function formatDate(ts) {
  if (!ts) return 'Today'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString())     return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday:'long', month:'short', day:'numeric' })
}

function groupByDate(entries) {
  const groups = {}
  entries.forEach(e => {
    const d   = e.createdAt?.toDate ? e.createdAt.toDate() : new Date()
    const key = d.toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return groups
}

export default function HistoryPage() {
  const { user }                      = useAuth()
  const tts                           = useTTS()
  const [entries,  setEntries]        = useState([])
  const [loading,  setLoading]        = useState(true)
  const [filter,   setFilter]         = useState('all')
  const [deleting, setDeleting]       = useState(null)

  const loadHistory = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const ref  = collection(db, 'users', user.uid, 'history')
      const q    = query(ref, orderBy('createdAt','desc'), limit(200))
      const snap = await getDocs(q)
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      setEntries(list)
    } catch (e) {
      console.error('loadHistory:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function deleteEntry(id) {
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', id))
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  async function clearAll() {
    if (!window.confirm('Clear all history? This cannot be undone.')) return
    try {
      const ref  = collection(db, 'users', user.uid, 'history')
      const snap = await getDocs(ref)
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
      setEntries([])
    } catch (e) {
      console.error(e)
    }
  }

  function exportHistory() {
    const lines = entries.map(e => {
      const d    = e.createdAt?.toDate ? e.createdAt.toDate() : new Date()
      const date = d.toLocaleDateString()
      const time = d.toLocaleTimeString()
      return `${date} ${time} | ${e.mode || 'unknown'} | ${e.confidence || 0}% | ${e.text}`
    }).join('\n')
    const blob = new Blob(
      [`SynTalk History Export\n${'='.repeat(40)}\n${lines}`],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = `syntalk-history-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.mode === filter)

  const grouped  = groupByDate(filtered)
  const hwCount  = entries.filter(e => e.mode === 'hardware').length
  const camCount = entries.filter(e => e.mode === 'camera').length
  const hyCount  = entries.filter(e => e.mode === 'hybrid').length

  if (loading) return <HistorySkeleton/>

  return (
    <div className="p-6 flex flex-col gap-5 min-h-screen">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', letterSpacing:'0.12em', textTransform:'uppercase' }}>
            Past Sessions
          </p>
          <h1 className="font-display font-light mt-1"
            style={{ fontSize:30, color:'var(--text-primary)' }}>
            History &amp; Replay
          </h1>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          {entries.length > 0 && (
            <>
              <button onClick={exportHistory}
                style={{
                  display:'flex', alignItems:'center', gap:7,
                  padding:'8px 14px', borderRadius:10, cursor:'pointer',
                  background:'rgba(74,127,165,0.10)',
                  border:'1px solid rgba(74,127,165,0.20)',
                  color:'var(--accent-light)', fontSize:13, fontFamily:'DM Sans',
                }}>
                <Download size={13}/> Export
              </button>
              <button onClick={clearAll}
                style={{
                  display:'flex', alignItems:'center', gap:7,
                  padding:'8px 14px', borderRadius:10, cursor:'pointer',
                  background:'rgba(239,68,68,0.08)',
                  border:'1px solid rgba(239,68,68,0.18)',
                  color:'#fca5a5', fontSize:13, fontFamily:'DM Sans',
                }}>
                <Trash2 size={13}/> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Total',    value: entries.length, icon:<MessageSquare size={13}/> },
          { label:'Hardware', value: hwCount,         icon:<History size={13}/> },
          { label:'Camera',   value: camCount,        icon:<Clock size={13}/> },
          { label:'Hybrid',   value: hyCount,         icon:<MessageSquare size={13}/> },
        ].map(s => (
          <div key={s.label} className="glass-raised rounded-xl p-4"
            style={{ border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8, color:'var(--text-muted)' }}>
              {s.icon}
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {s.label}
              </span>
            </div>
            <p className="font-display font-light"
              style={{ fontSize:32, color:'var(--text-primary)', lineHeight:1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6 }}>
        {['all','hardware','camera','hybrid'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding:'7px 16px', borderRadius:10, cursor:'pointer',
              fontSize:13, fontFamily:'DM Sans',
              background: filter===f ? 'rgba(74,127,165,0.15)' : 'rgba(255,255,255,0.04)',
              border: filter===f ? '1px solid rgba(74,127,165,0.28)' : '1px solid var(--border)',
              color: filter===f ? 'var(--text-primary)' : 'var(--text-muted)',
              transition:'all 0.15s', textTransform:'capitalize',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center"
          style={{ border:'1px dashed rgba(255,255,255,0.08)' }}>
          <History size={28} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }}/>
          <h3 className="font-display font-light mb-2"
            style={{ fontSize:22, color:'var(--text-primary)' }}>
            {entries.length === 0 ? 'No history yet' : 'No entries for this filter'}
          </h3>
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>
            {entries.length === 0
              ? 'Recognised gestures from all modes will appear here automatically.'
              : `No ${filter} mode entries found.`
            }
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey}>
              {/* Date divider */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', whiteSpace:'nowrap' }}>
                  {formatDate(items[0].createdAt)} · {items.length} gesture{items.length!==1?'s':''}
                </span>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              </div>

              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {items.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity:0, y:8 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, x:-20 }}
                      transition={{ delay:i*0.02 }}
                      className="glass-raised rounded-xl group"
                      style={{
                        border:'1px solid var(--border)',
                        padding:'12px 16px',
                        transition:'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(74,127,165,0.20)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                    >
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p className="font-display font-light"
                            style={{ fontSize:24, color:'var(--text-primary)', lineHeight:1.2, marginBottom:6 }}>
                            {entry.text}
                          </p>
                          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', display:'flex', alignItems:'center', gap:4 }}>
                              <Clock size={9}/> {formatTime(entry.createdAt)}
                            </span>
                            <span style={{
                              fontSize:10, fontFamily:'JetBrains Mono',
                              padding:'2px 8px', borderRadius:20,
                              background: entry.mode==='hardware'
                                ? 'rgba(74,127,165,0.12)'
                                : entry.mode==='hybrid'
                                ? 'rgba(168,85,247,0.12)'
                                : 'rgba(59,130,246,0.12)',
                              border: entry.mode==='hardware'
                                ? '1px solid rgba(74,127,165,0.22)'
                                : entry.mode==='hybrid'
                                ? '1px solid rgba(168,85,247,0.22)'
                                : '1px solid rgba(59,130,246,0.22)',
                              color: entry.mode==='hardware'
                                ? 'var(--accent-light)'
                                : entry.mode==='hybrid'
                                ? '#d8b4fe'
                                : '#93c5fd',
                            }}>
                              {entry.mode || 'hardware'}
                            </span>
                            {entry.confidence > 0 && (
                              <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                                {entry.confidence}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons — show on hover */}
                        <div style={{
                          display:'flex', alignItems:'center', gap:5,
                          opacity:0, transition:'opacity 0.15s',
                        }}
                          className="group-hover-actions"
                          ref={el => {
                            if (el) {
                              el.closest('.group')
                                ?.addEventListener('mouseenter', () => el.style.opacity=1)
                              el.closest('.group')
                                ?.addEventListener('mouseleave', () => el.style.opacity=0)
                            }
                          }}>
                          <button
                            onClick={() => tts.speak(entry.text)}
                            title="Replay"
                            style={{
                              width:30, height:30, borderRadius:8, cursor:'pointer',
                              background:'rgba(74,127,165,0.10)',
                              border:'1px solid rgba(74,127,165,0.20)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'var(--accent-light)',
                            }}>
                            <Volume2 size={13}/>
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            disabled={deleting === entry.id}
                            title="Delete"
                            style={{
                              width:30, height:30, borderRadius:8, cursor:'pointer',
                              background:'rgba(239,68,68,0.08)',
                              border:'1px solid rgba(239,68,68,0.18)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'#fca5a5',
                              opacity: deleting===entry.id ? 0.5 : 1,
                            }}>
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}