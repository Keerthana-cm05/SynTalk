import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardSidebar from './DashboardSidebar'
import WelcomeScreen from '../ui/WelcomeScreen'
import { useAuth } from '../../context/AuthContext'
import { preloadGestureModel } from '../../hooks/useGestureTrainer'

export default function DashboardLayout() {
  const { user }                  = useAuth()
  const [welcomed, setWelcomed]   = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('syntalk_welcomed')) setWelcomed(true)
  }, [])

  // Preload trained gesture model as soon as user is known
  useEffect(() => {
    if (!user?.uid) return
    preloadGestureModel(user.uid).finally(() => setModelLoaded(true))
  }, [user?.uid])

  const handleDone = useCallback(() => {
    sessionStorage.setItem('syntalk_welcomed', 'true')
    setWelcomed(true)
  }, [])

  const firstName = user?.displayName?.split(' ')[0] || 'there'

  return (
    <>
      <AnimatePresence>
        {!welcomed && (
          <WelcomeScreen
            userName={firstName}
            onComplete={handleDone}
          />
        )}
      </AnimatePresence>

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