import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../firebase/config'
import {
  collection, query, orderBy, limit,
  getDocs, addDoc, serverTimestamp, deleteDoc, doc
} from 'firebase/firestore'
import {
  History, Volume2, Trash2, Clock,
  MessageSquare, Filter, 
} from 'lucide-react'
import { useTTS } from '../../hooks/useTTS'
import { Download } from 'lucide-react'

function formatTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDate(entries) {
  const groups = {}
  entries.forEach(e => {
    const d = e.createdAt?.toDate ? e.createdAt.toDate() : new Date()
    const key = d.toDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return groups
}

export default function HistoryPage() {
  const { user }        = useAuth()
  const tts             = useTTS()
  const [entries,    setEntries]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')  // all | hardware | camera
  const [deleting,   setDeleting]   = useState(null)

  async function loadHistory() {
    if (!user) return
    setLoading(true)
    try {
      const ref  = collection(db, 'users', user.uid, 'history')
      const q    = query(ref, orderBy('createdAt', 'desc'), limit(100))
      const snap = await getDocs(q)
      const list = []
      snap.forEach(d => list.push({ id: d.id, ...d.data() }))
      setEntries(list)
    } catch (e) {
      console.error('loadHistory:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [user])

  async function deleteEntry(id) {
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'history', id))
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (e) {
      console.error('delete:', e)
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
      console.error('clearAll:', e)
    }
  }

  const filtered = filter === 'all'
    ? entries
    : entries.filter(e => e.mode === filter)

  const grouped = groupByDate(filtered)
  const total   = entries.length
  const hwCount = entries.filter(e => e.mode === 'hardware').length
  const camCount= entries.filter(e => e.mode === 'camera').length

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">

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
    {/* Export button */}
    {entries.length > 0 && (
      <button
        onClick={() => {
          const lines = entries.map(e =>
            `${formatDate(e.createdAt)} ${formatTime(e.createdAt)} | ${e.mode || 'hardware'} | ${e.confidence || 0}% | ${e.text}`
          ).join('\n')
          const blob = new Blob([lines], { type:'text/plain' })
          const url  = URL.createObjectURL(blob)
          const a    = document.createElement('a')
          a.href     = url
          a.download = `syntalk-history-${Date.now()}.txt`
          a.click()
          URL.revokeObjectURL(url)
        }}
        style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'8px 14px', borderRadius:10, cursor:'pointer',
          background:'rgba(74,127,165,0.10)',
          border:'1px solid rgba(74,127,165,0.20)',
          color:'var(--accent-light)', fontSize:13,
          fontFamily:'DM Sans',
        }}>
        <Download size={13}/> Export
      </button>
    )}

    {entries.length > 0 && (
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
    )}
  </div>
</div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total',    value: total,    icon: <MessageSquare size={14}/> },
          { label:'Hardware', value: hwCount,  icon: <History size={14}/> },
          { label:'Camera',   value: camCount, icon: <Filter size={14}/> },
        ].map(s => (
          <div key={s.label} className="glass-raised rounded-xl p-4"
            style={{ border:'1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1.5" style={{ color:'var(--text-muted)' }}>
              {s.icon}
              <span style={{ fontSize:11, fontFamily:'JetBrains Mono', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {s.label}
              </span>
            </div>
            <p className="font-display font-light"
              style={{ fontSize:34, color:'var(--text-primary)', lineHeight:1 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {['all','hardware','camera'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl font-body transition-all duration-150"
            style={{
              fontSize:13,
              background: filter===f ? 'rgba(74,127,165,0.15)' : 'rgba(255,255,255,0.04)',
              border: filter===f ? '1px solid rgba(74,127,165,0.28)' : '1px solid var(--border)',
              color: filter===f ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor:'pointer',
              textTransform:'capitalize',
            }}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor:'var(--accent)' }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center"
          style={{ border:'1px dashed rgba(255,255,255,0.08)' }}>
          <History size={28} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }}/>
          <h3 className="font-display font-light mb-2"
            style={{ fontSize:22, color:'var(--text-primary)' }}>
            No history yet
          </h3>
          <p style={{ fontSize:13, color:'var(--text-muted)' }}>
            Your recognised gestures will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1" style={{ background:'var(--border)' }}/>
                <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono', whiteSpace:'nowrap' }}>
                  {formatDate(items[0].createdAt)}
                </span>
                <div className="h-px flex-1" style={{ background:'var(--border)' }}/>
              </div>

              {/* Entries */}
              <div className="flex flex-col gap-2">
                <AnimatePresence>
                  {items.map((entry, i) => (
                    <motion.div key={entry.id}
                      initial={{ opacity:0, y:8 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, x:-20 }}
                      transition={{ delay:i*0.03 }}
                      className="glass-raised rounded-xl group"
                      style={{ border:'1px solid var(--border)', padding:'12px 16px' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-light"
                            style={{ fontSize:22, color:'var(--text-primary)', lineHeight:1.2 }}>
                            {entry.text}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                              <Clock size={9} style={{ display:'inline', marginRight:3 }}/>
                              {formatTime(entry.createdAt)}
                            </span>
                            <span style={{
                              fontSize:10, fontFamily:'JetBrains Mono',
                              padding:'2px 8px', borderRadius:20,
                              background: entry.mode==='hardware'
                                ? 'rgba(74,127,165,0.12)' : 'rgba(59,130,246,0.12)',
                              border: entry.mode==='hardware'
                                ? '1px solid rgba(74,127,165,0.22)' : '1px solid rgba(59,130,246,0.22)',
                              color: entry.mode==='hardware' ? 'var(--accent-light)' : '#93c5fd',
                            }}>
                              {entry.mode || 'hardware'}
                            </span>
                            {entry.confidence && (
                              <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono' }}>
                                {entry.confidence}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => tts.speak(entry.text)}
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
                            style={{
                              width:30, height:30, borderRadius:8, cursor:'pointer',
                              background:'rgba(239,68,68,0.08)',
                              border:'1px solid rgba(239,68,68,0.18)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'#fca5a5', opacity: deleting===entry.id ? 0.5 : 1,
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