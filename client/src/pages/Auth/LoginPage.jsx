import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AuthBackground from '../../components/ui/AuthBackground'
import InputField from '../../components/ui/InputField'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setAuthError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      const msg = getFirebaseError(err.code)
      setAuthError(msg)
    } finally {
      setLoading(false)
    }
  }

  function getFirebaseError(code) {
    switch (code) {
      case 'auth/user-not-found': return 'No account found with this email.'
      case 'auth/wrong-password': return 'Incorrect password. Try again.'
      case 'auth/invalid-email': return 'Invalid email address.'
      case 'auth/too-many-requests': return 'Too many attempts. Please wait.'
      case 'auth/invalid-credential': return 'Invalid email or password.'
      default: return 'Something went wrong. Please try again.'
    }
  }

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex items-center justify-center px-6 noise">
      <AuthBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl bg-accent/20" />
              <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-accent-light to-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold font-mono">ST</span>
              </div>
            </div>
            <span className="font-display text-2xl font-semibold tracking-wide text-text-primary">
              Syn<span className="text-accent-light">Talk</span>
            </span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="glass-raised rounded-2xl p-8 border border-white/6"
        >
          <motion.div variants={fadeUp} initial="initial" animate="animate"
            transition={{ duration: 0.6, delay: 0.1 }}>
            <h1 className="font-display text-3xl font-light text-text-primary mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-text-muted font-body mb-8">
              Sign in to continue to SynTalk
            </p>
          </motion.div>

          {/* Auth Error */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6"
            >
              <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300 font-body">{authError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.15 }}>
              <InputField
                label="Email address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                icon={<Mail size={15} />}
                error={errors.email}
                autoComplete="email"
                disabled={loading}
              />
            </motion.div>

            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.2 }}>
              <InputField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                icon={<Lock size={15} />}
                error={errors.password}
                autoComplete="current-password"
                disabled={loading}
              />
            </motion.div>

            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex justify-end"
            >
              <button type="button" className="text-xs text-accent-light hover:text-text-primary transition-colors font-body">
                Forgot password?
              </button>
            </motion.div>

            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.3 }}>
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 text-white py-3.5 rounded-xl font-medium text-sm tracking-wide shadow-lg shadow-accent/20 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-xs text-text-muted font-mono">or</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Gesture login hint */}
          <motion.div
            variants={fadeUp} initial="initial" animate="animate"
            transition={{ duration: 0.6, delay: 0.35 }}
            className="glass rounded-xl px-4 py-3 text-center border border-white/5"
          >
            <p className="text-xs text-text-muted font-body">
              🤌 <span className="text-text-secondary">Gesture login</span> and{' '}
              <span className="text-text-secondary">ML camera login</span> will be available
              after gesture setup
            </p>
          </motion.div>
        </motion.div>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-text-muted font-body mt-6"
        >
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent-light hover:text-text-primary transition-colors">
            Create one free
          </Link>
        </motion.p>
      </div>
    </div>
  )
}