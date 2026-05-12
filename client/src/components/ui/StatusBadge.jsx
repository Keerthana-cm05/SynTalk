export default function StatusBadge({ status, label }) {
  const styles = {
    connected: 'bg-green-500/12 border-green-500/25 text-green-300',
    disconnected: 'bg-red-500/12 border-red-500/25 text-red-300',
    idle: 'bg-yellow-500/12 border-yellow-500/25 text-yellow-300',
    active: 'bg-accent/12 border-accent/25 text-accent-light',
  }
  const dots = {
    connected: 'bg-green-400',
    disconnected: 'bg-red-400',
    idle: 'bg-yellow-400',
    active: 'bg-accent-light',
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono ${styles[status] || styles.idle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.idle} ${status === 'connected' || status === 'active' ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  )
}