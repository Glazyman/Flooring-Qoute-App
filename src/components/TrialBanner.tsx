import Link from 'next/link'

export default function TrialBanner({ remaining }: { remaining: number }) {
  const isOut = remaining === 0
  const isLast = remaining === 1

  const bg = isOut ? 'var(--danger)' : isLast ? 'var(--warning)' : 'var(--button-dark)'

  return (
    <div
      className="px-5 py-2.5 text-sm flex items-center justify-between gap-4 text-white"
      style={{ background: bg }}
    >
      <p className="text-sm">
        <span className="font-medium">
          {isOut
            ? "You've used all 3 free quotes."
            : `Free trial: ${remaining} quote${remaining !== 1 ? 's' : ''} remaining.`}
        </span>
        {' '}
        <span className="opacity-80">
          {isOut ? 'Subscribe to keep quoting.' : 'Subscribe to unlock unlimited quotes.'}
        </span>
      </p>
      <Link
        href="/billing/setup"
        className="flex-shrink-0 bg-white/20 hover:bg-white/30 font-medium px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap"
      >
        Choose a plan →
      </Link>
    </div>
  )
}
