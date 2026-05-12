import { createContext, useContext, useState, useCallback } from 'react'

const WelcomeContext = createContext(null)

export function WelcomeProvider({ children }) {
  const [welcomed, setWelcomed] = useState(() => {
    return sessionStorage.getItem('syntalk_welcomed') === 'true'
  })

  const markWelcomed = useCallback(() => {
    sessionStorage.setItem('syntalk_welcomed', 'true')
    setWelcomed(true)
  }, [])

  const resetWelcome = useCallback(() => {
    sessionStorage.removeItem('syntalk_welcomed')
    setWelcomed(false)
  }, [])

  return (
    <WelcomeContext.Provider value={{ welcomed, markWelcomed, resetWelcome }}>
      {children}
    </WelcomeContext.Provider>
  )
}

export function useWelcome() {
  const ctx = useContext(WelcomeContext)
  if (!ctx) throw new Error('useWelcome must be used inside WelcomeProvider')
  return ctx
}