'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function ApproveMeasurementButton({ quoteId }: { quoteId: string }) {
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
    // Brief pause so user sees feedback, then refresh
    setTimeout(() => router.refresh(), 600)
  }

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 px-3 py-1.5 bg-green-50 rounded-xl">
        <CheckCircle className="w-3.5 h-3.5" /> Approved
      </span>
    )
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="flex items-center gap-1.5 text-white font-semibold px-3.5 py-2 rounded-2xl text-xs disabled:opacity-60 active:scale-95 transition-all whitespace-nowrap"
      style={{ background: 'var(--primary)' }}
    >
      <CheckCircle className="w-3.5 h-3.5" />
      {loading ? 'Approving…' : 'Approve Quote'}
    </button>
  )
}
