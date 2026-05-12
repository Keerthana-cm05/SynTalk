export default function Footer() {
  return (
    <footer className="relative py-10 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-display text-lg text-text-secondary">
          Syn<span className="text-accent-light">Talk</span>
        </div>
        <p className="text-xs text-text-muted font-body text-center">
          Built with hardware, AI, and empathy. Final Year Project — ECE.
        </p>
        <p className="text-xs text-text-muted font-mono">© 2025 SynTalk</p>
      </div>
    </footer>
  )
}