import { useState, useEffect, useCallback } from 'react'
import { Outlet }           from 'react-router-dom'
import { motion }           from 'framer-motion'
import DashboardSidebar     from './DashboardSidebar'
import WelcomeScreen        from '../ui/WelcomeScreen'
import { useAuth }          from '../../context/AuthContext'
import { preloadGestureModel } from '../../hooks/useGestureTrainer'

export default function DashboardLayout() {
  const { user }                        = useAuth()
  const [welcomed,    setWelcomed]      = useState(false)
  const [modelReady,  setModelReady]    = useState(false)

  useEffect(() => {
    // Check if this session has already shown the welcome
    const alreadyWelcomed = sessionStorage.getItem('syntalk_welcomed') === 'true'
    if (alreadyWelcomed) {
      setWelcomed(true)
    }
    // else welcomed stays false → WelcomeScreen renders
  }, [])

  // Preload gesture model as soon as uid is known
  useEffect(() => {
    if (!user?.uid) return
    preloadGestureModel(user.uid).finally(() => setModelReady(true))
  }, [user?.uid])

  const handleDone = useCallback(() => {
    sessionStorage.setItem('syntalk_welcomed', 'true')
    setWelcomed(true)
  }, [])

  const firstName = user?.displayName?.split(' ')[0] || 'there'

  return (
    <>
      {/* Welcome screen — blocks dashboard until complete */}
      {!welcomed && (
        <WelcomeScreen
          userName={firstName}
          onComplete={handleDone}
        />
      )}

      {/* Dashboard — only mounts after welcome */}
      {welcomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="dashboard-bg noise flex min-h-screen"
        >
          <div className="sticky top-0 h-screen flex-shrink-0 z-20">
            <DashboardSidebar />
          </div>
          <main className="flex-1 overflow-y-auto min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="min-h-screen"
            >
              <Outlet />
            </motion.div>
          </main>
        </motion.div>
      )}
    </>
  )
}