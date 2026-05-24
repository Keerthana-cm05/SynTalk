import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sign up with email & password
  async function signup(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName })
  await setDoc(doc(db, 'users', result.user.uid), {
    uid:                  result.user.uid,
    displayName,
    email,
    createdAt:            serverTimestamp(),
    gestureSetupComplete: false,
    settings: {
      theme:    'dark',
      fontSize: 'medium',
      handMode: 'right',
      language: 'en',
    },
  })
  // Clear welcome so it shows after setup
  try { sessionStorage.removeItem('syntalk_welcomed') } catch {}
  return result
}

  // Sign out
  async function logout() {
    await signOut(auth)
    setUserProfile(null)
  }

  // Fetch user profile from Firestore
  async function fetchUserProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setUserProfile(docSnap.data())
        return docSnap.data()
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
    return null
  }
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser)
    if (firebaseUser) {
      await fetchUserProfile(firebaseUser.uid)
      try { localStorage.setItem('syntalk_last_uid', firebaseUser.uid) } catch {}
    }
    setLoading(false)
  })
  return unsubscribe
}, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid)
      }
    
      setLoading(false)
    })
    return unsubscribe
  }, [])
async function login(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password)
  // Clear welcome so it plays on every fresh login
  try {
    sessionStorage.removeItem('syntalk_welcomed')
    localStorage.setItem('syntalk_last_uid',   result.user.uid)
    localStorage.setItem('syntalk_last_email', email)
  } catch {}
  return result
}
  const value = {
    user,
    userProfile,
    loading,
    signup,
    login,
    logout,
    fetchUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}