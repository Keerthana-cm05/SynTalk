import { motion } from 'framer-motion'
import { Link }   from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="dashboard-bg noise min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity:0, y:24 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
        className="text-center"
        style={{ maxWidth:420 }}
      >
        {/* Big 404 */}
        <div className="font-display font-light mb-4"
          style={{
            fontSize:120, lineHeight:1,
            background:'linear-gradient(135deg,rgba(74,127,165,0.3),rgba(74,127,165,0.05))',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            backgroundClip:'text',
          }}>
          404
        </div>

        <h1 className="font-display font-light mb-3"
          style={{ fontSize:28, color:'var(--text-primary)' }}>
          Page not found
        </h1>
        <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7, marginBottom:32 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <Link to="/"
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'10px 22px', borderRadius:12,
              background:'#4a7fa5', color:'#fff',
              fontSize:14, fontFamily:'DM Sans', fontWeight:500,
              textDecoration:'none',
              boxShadow:'0 4px 18px rgba(74,127,165,0.28)',
            }}>
            <Home size={15}/> Go Home
          </Link>
          <button onClick={() => window.history.back()}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'10px 22px', borderRadius:12,
              background:'rgba(255,255,255,0.05)',
              border:'1px solid var(--border)',
              color:'var(--text-muted)', fontSize:14,
              fontFamily:'DM Sans', cursor:'pointer',
            }}>
            <ArrowLeft size={15}/> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  )
}