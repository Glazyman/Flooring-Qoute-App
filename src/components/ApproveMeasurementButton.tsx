'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

export default function ApproveMeasurementButton({ quoteId, onApprove }: { quoteId: string; onApprove?: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await fetch(`/api/quotes/${quoteId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pending' }),
    })
    setDone(true)
    setLoading(false)
    if (onApprove) {
      onApprove()
    } else {
      setTimeout(() => router.refresh(), 600)
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-xs" style={{ color: '#10B981' }}>
        <Check className="w-3.5 h-3.5" /> Approved
      </span>
    )
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="flex items-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors disabled:opacity-60 whitespace-nowrap"
      style={{ background: 'var(--button-dark)' }}
    >
      <Check className="w-3.5 h-3.5" />
      {loading ? 'Approving…' : 'Approve'}
    </button>
  )
}
