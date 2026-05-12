import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AuthBackground from '../../components/ui/AuthBackground'
import InputField from '../../components/ui/InputField'


const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a letter', pass: /[a-zA-Z]/.test(password) },
  ]

  if (!password) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="flex flex-col gap-1.5 mt-2"
    >
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-2">
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${c.pass ? 'bg-green-500/20 border border-green-500/40' : 'bg-white/5 border border-white/10'}`}>
            {c.pass && <Check size={8} className="text-green-400" />}
          </div>
          <span className={`text-xs font-body transition-colors duration-300 ${c.pass ? 'text-green-400' : 'text-text-muted'}`}>
            {c.label}
          </span>
        </div>
      ))}
    </motion.div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    const errs = {}
    if (!form.displayName.trim()) errs.displayName = 'Name is required'
    else if (form.displayName.trim().length < 2) errs.displayName = 'Name too short'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 6) errs.password = 'Minimum 6 characters'
    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
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
      await signup(form.email, form.password, form.displayName)
      navigate('/gesture-setup')
    } catch (err) {
      const msg = getFirebaseError(err.code)
      setAuthError(msg)
    } finally {
      setLoading(false)
    }
  }

  function getFirebaseError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'An account with this email already exists.'
      case 'auth/invalid-email': return 'Invalid email address.'
      case 'auth/weak-password': return 'Password is too weak.'
      case 'auth/operation-not-allowed': return 'Email sign-up is not enabled.'
      default: return 'Something went wrong. Please try again.'
    }
  }

  return (
    <div className="relative min-h-screen bg-charcoal-950 flex items-center justify-center px-6 py-12 noise">
      <AuthBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2.5">
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
              Create account
            </h1>
            <p className="text-sm text-text-muted font-body mb-8">
              Join SynTalk and start communicating your way
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
              transition={{ duration: 0.6, delay: 0.12 }}>
              <InputField
                label="Full name"
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="Your name"
                icon={<User size={15} />}
                error={errors.displayName}
                autoComplete="name"
                disabled={loading}
              />
            </motion.div>

            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.16 }}>
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
                placeholder="Create a strong password"
                icon={<Lock size={15} />}
                error={errors.password}
                autoComplete="new-password"
                disabled={loading}
              />
              <PasswordStrength password={form.password} />
            </motion.div>

            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.24 }}>
              <InputField
                label="Confirm password"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repeat your password"
                icon={<Lock size={15} />}
                error={errors.confirmPassword}
                autoComplete="new-password"
                disabled={loading}
              />
            </motion.div>

            <motion.div variants={fadeUp} initial="initial" animate="animate"
              transition={{ duration: 0.6, delay: 0.28 }}>
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 text-white py-3.5 rounded-xl font-medium text-sm tracking-wide shadow-lg shadow-accent/20 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Terms note */}
          <motion.p
            variants={fadeUp} initial="initial" animate="animate"
            transition={{ duration: 0.6, delay: 0.32 }}
            className="text-xs text-text-muted text-center mt-5 font-body leading-relaxed"
          >
            After signup, you'll set up your personalized gestures before accessing the dashboard.
          </motion.p>
        </motion.div>

        {/* Login link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-text-muted font-body mt-6"
        >
          Already have an account?{' '}
          <Link to="/login" className="text-accent-light hover:text-text-primary transition-colors">
            Sign in
          </Link>
        </motion.p>
      </div>
    </div>
  )
}