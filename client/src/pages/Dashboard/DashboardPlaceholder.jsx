import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthBackground from '../../components/ui/AuthBackground'
import { LayoutDashboard, LogOut } from 'lucide-react'

export default function DashboardPlaceholder() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex items-center justify-center px-6 noise">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass-raised rounded-2xl p-10 border border-white/6"
        >
          <div className="w-14 h-14 rounded-2xl glass border border-accent/20 flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard size={24} className="text-accent-light" />
          </div>
          <h1 className="font-display text-3xl font-light text-text-primary mb-3">
            Dashboard
          </h1>
          <p className="text-text-secondary text-sm font-body mb-2">
            Signed in as <span className="text-text-primary">{user?.displayName}</span>
          </p>
          <p className="text-text-muted text-xs font-mono mb-8">{user?.email}</p>

          <div className="glass rounded-xl px-4 py-3 mb-8 border border-accent/10">
            <p className="text-xs text-text-secondary font-body">
              🚀 Full dashboard is coming in <span className="text-accent-light font-medium">Step 4</span> of the build.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="group w-full flex items-center justify-center gap-2 glass hover:border-red-500/30 border border-white/8 transition-all duration-300 text-text-secondary hover:text-red-300 py-3.5 rounded-xl font-medium text-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  )
}