import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon,
  autoComplete,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-body text-text-secondary tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`
            w-full glass rounded-xl py-3.5 text-sm text-text-primary
            placeholder:text-text-muted font-body
            border transition-all duration-200 outline-none
            focus:border-accent/50 focus:ring-1 focus:ring-accent/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10 pr-4' : 'px-4'}
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : 'border-white/8'}
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-400 font-body mt-0.5">{error}</p>
      )}
    </div>
  )
}