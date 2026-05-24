import { motion } from 'framer-motion'

function Shimmer({ style, className }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        ...style,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function SkeletonText({ width = '100%', height = 14, style }) {
  return <Shimmer style={{ width, height, borderRadius: 4, ...style }}/>
}

export function SkeletonCard({ height = 80, style }) {
  return <Shimmer style={{ width: '100%', height, borderRadius: 12, ...style }}/>
}

export function SkeletonAvatar({ size = 40 }) {
  return <Shimmer style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}/>
}

// Dashboard page loading skeleton
export function DashboardSkeleton() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonText width={120} height={11}/>
          <SkeletonText width={220} height={32}/>
        </div>
        <SkeletonCard width={260} height={44} style={{ width: 260 }}/>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', gap: 16 }}>
        <SkeletonCard height={400} style={{ flex: 1 }}/>
        <SkeletonCard height={400} style={{ width: 260, flexShrink: 0 }}/>
      </div>
    </div>
  )
}

export function HistorySkeleton() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SkeletonText width={180} height={30}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[1,2,3].map(i => <SkeletonCard key={i} height={80}/>)}
      </div>
      {[1,2,3,4,5].map(i => <SkeletonCard key={i} height={64}/>)}
    </div>
  )
}