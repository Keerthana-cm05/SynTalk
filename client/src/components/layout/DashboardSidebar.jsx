import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  LayoutDashboard, Dumbbell, History,
  ShieldAlert, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/dashboard/training',  icon: Dumbbell,        label: 'Training'  },
  { to: '/dashboard/history',   icon: History,         label: 'History'   },
  { to: '/dashboard/emergency', icon: ShieldAlert,     label: 'Emergency' },
  { to: '/dashboard/settings',  icon: Settings,        label: 'Settings'  },
]

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout }          = useAuth()
  const navigate                  = useNavigate()

  const initials = user?.displayName
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 210 }}
      transition={{ duration: 0.28, ease: [0.22,1,0.36,1] }}
      className="relative flex flex-col h-full glass border-r overflow-hidden flex-shrink-0"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b"
        style={{ borderColor: 'var(--border)', minHeight: 60 }}>
        <div className="relative w-7 h-7 flex-shrink-0">
          <div className="absolute inset-0 rounded-lg"
            style={{ background: 'rgba(74,127,165,0.18)' }} />
          <div className="absolute inset-0.5 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6a9fc5,#3a6f95)' }}>
            <span className="text-white font-bold font-mono" style={{ fontSize: 9 }}>ST</span>
          </div>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity:0, x:-8 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-8 }}
              transition={{ duration:.18 }}
              className="font-display font-semibold tracking-wide whitespace-nowrap"
              style={{ fontSize: 17, color: 'var(--text-primary)' }}
            >
              Syn<span style={{ color: 'var(--accent-light)' }}>Talk</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl
               transition-all duration-150 group
               ${isActive
                 ? 'text-text-primary'
                 : 'text-text-muted hover:text-text-secondary'
               }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="sidebar-pill"
                    className="absolute inset-0 rounded-xl"
                    style={{ background:'rgba(74,127,165,0.13)', border:'1px solid rgba(74,127,165,0.22)' }}
                    transition={{ duration:.22, ease:[0.22,1,0.36,1] }}
                  />
                )}
                <Icon size={16} className="flex-shrink-0 relative z-10"
                  style={{ color: isActive ? 'var(--accent-light)' : undefined }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity:0, x:-6 }}
                      animate={{ opacity:1, x:0 }}
                      exit={{ opacity:0, x:-6 }}
                      transition={{ duration:.15 }}
                      className="relative z-10 whitespace-nowrap font-body"
                      style={{ fontSize: 13.5 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-3 flex flex-col gap-0.5 border-t pt-2"
        style={{ borderColor: 'var(--border)' }}>
        {/* User chip */}
        <div className="flex items-center gap-2 px-2.5 py-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(74,127,165,0.18)', border:'1px solid rgba(74,127,165,0.28)' }}>
            <span className="font-mono font-bold"
              style={{ fontSize:9, color:'var(--accent-light)' }}>{initials}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-6 }}
                transition={{ duration:.15 }}
                className="overflow-hidden"
              >
                <p className="font-body truncate max-w-[120px]"
                  style={{ fontSize:12.5, color:'var(--text-secondary)' }}>
                  {user?.displayName}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl
            transition-all duration-150 group"
          style={{ color:'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color='#f87171'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
        >
          <LogOut size={15} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-6 }}
                transition={{ duration:.15 }}
                className="font-body whitespace-nowrap"
                style={{ fontSize:13.5 }}
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center z-20 transition-colors"
        style={{
          background:'var(--bg-raised)',
          border:'1px solid var(--border)',
          color:'var(--text-muted)',
        }}
      >
        {collapsed ? <ChevronRight size={11}/> : <ChevronLeft size={11}/>}
      </button>
    </motion.aside>
  )
}