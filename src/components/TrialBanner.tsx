import Link from 'next/link'

export default function TrialBanner({ remaining }: { remaining: number }) {
  const isOut = remaining === 0
  const isLast = remaining === 1

  return (
    <div
      className={`px-5 py-3 text-sm flex items-center justify-between gap-4 ${
        isOut
          ? 'bg-red-500 text-white'
          : isLast
          ? 'bg-amber-500 text-white'
          : 'bg-violet-600 text-white'
      }`}
    >
      <p className="font-medium text-sm">
        {isOut
          ? "You've used all 3 free quotes."
          : `Free trial: ${remaining} quote${remaining !== 1 ? 's' : ''} remaining.`}
        {' '}
        <span className="opacity-80">
          {isOut ? 'Subscribe to keep quoting.' : 'Subscribe to unlock unlimited quotes.'}
        </span>
      </p>
      <Link
        href="/billing/setup"
        className="flex-shrink-0 bg-white/20 hover:bg-white/30 font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap"
      >
        Choose a Plan →
      </Link>
    </div>
  )
}
