const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  'https://flooring-qoute-app.vercel.app'

interface Props {
  quoteId: string
  customerEmail: string | null
  customerName: string
  finalTotal: string
  depositPct: number
  depositAmount: string
  remainingBalance: string
  validDays: number
}

export default function EmailQuoteButton({
  quoteId,
  customerEmail,
  customerName,
  finalTotal,
  depositPct,
  depositAmount,
  remainingBalance,
  validDays,
}: Props) {
  const emailIcon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  )

  if (!customerEmail) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 cursor-not-allowed"
        style={{ background: '#e5e7eb', color: '#9ca3af' }}
        title="No email address on file for this customer"
      >
        {emailIcon}
        No Email on File
      </button>
    )
  }

  const quoteUrl = `${APP_URL}/quotes/${quoteId}`

  const subject = `Your Flooring Estimate is Ready – ${customerName}`

  const body = [
    `Hi ${customerName},`,
    '',
    'Thank you for choosing us! Please find your flooring estimate details below.',
    '',
    `Estimate Total: ${finalTotal}`,
    `Deposit Required (${depositPct}%): ${depositAmount}`,
    `Remaining Balance: ${remainingBalance}`,
    `Quote Valid For: ${validDays} days`,
    '',
    'To download your PDF estimate, please visit:',
    quoteUrl,
    '',
    'Feel free to reply to this email with any questions.',
    '',
    'We look forward to working with you!',
  ].join('\n')

  const href = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <a
      href={href}
      className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95 transition-transform"
      style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
    >
      {emailIcon}
      Email Customer
    </a>
  )
}
