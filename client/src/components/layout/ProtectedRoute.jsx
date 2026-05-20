import { Navigate }  from 'react-router-dom'
import { useAuth }   from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, userProfile, loading } = useAuth()

  // Show loading spinner while auth state resolves
  if (loading) {
    return (
      <div className="fixed inset-0 dashboard-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)' }}
          />
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono',
            letterSpacing: '0.1em',
          }}>
            SYNTALK
          </span>
        </div>
      </div>
    )
  }

  // Not logged in — go to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const path = window.location.pathname

  // Already on gesture-setup — let them through always
  if (path === '/gesture-setup') {
    return children
  }

  // On dashboard routes — only redirect if:
  // 1. userProfile has loaded (not null/undefined)
  // 2. gestureSetupComplete is explicitly false
  if (
    path.startsWith('/dashboard') &&
    userProfile !== null &&
    userProfile !== undefined &&
    userProfile.gestureSetupComplete === false
  ) {
    return <Navigate to="/gesture-setup" replace />
  }

  return children
}