import Link from 'next/link'

export default function TrialBanner({ remaining }: { remaining: number }) {
  const isOut = remaining === 0
  const isLast = remaining === 1

  const bg = isOut
    ? 'rgba(239,68,68,0.12)'
    : isLast
    ? 'rgba(245,158,11,0.12)'
    : 'rgba(91,114,248,0.12)'

  const color = isOut ? '#ef4444' : isLast ? '#f59e0b' : '#818cf8'
  const border = isOut ? 'rgba(239,68,68,0.25)' : isLast ? 'rgba(245,158,11,0.25)' : 'rgba(91,114,248,0.25)'

  return (
    <div
      className="px-5 py-3 text-sm flex items-center justify-between gap-4"
      style={{ background: bg, borderBottom: `1px solid ${border}` }}
    >
      <p className="font-medium text-sm" style={{ color }}>
        {isOut
          ? "You've used all 3 free quotes."
          : `Free trial: ${remaining} quote${remaining !== 1 ? 's' : ''} remaining.`}
        {' '}
        <span style={{ color, opacity: 0.7 }}>Subscribe to unlock unlimited.</span>
      </p>
      <Link
        href="/billing/setup"
        className="flex-shrink-0 font-bold px-3 py-1.5 rounded-xl text-xs transition-all whitespace-nowrap text-white"
        style={{ background: 'var(--primary-gradient)' }}
      >
        Upgrade →
      </Link>
    </div>
  )
}
