'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InvoiceStatus } from '@/lib/types'

const NEXT_STATUS: Record<InvoiceStatus, { label: string; next: InvoiceStatus } | null> = {
  draft: { label: 'Mark as Sent', next: 'sent' },
  sent: { label: 'Mark as Paid', next: 'paid' },
  paid: null,
}

export default function InvoiceStatusButton({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string
  currentStatus: InvoiceStatus
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const action = NEXT_STATUS[currentStatus]

  if (!action) return null

  async function handleUpdate() {
    setLoading(true)
    await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action!.next }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleUpdate}
      disabled={loading}
      className="text-white font-semibold px-4 py-2 rounded-2xl text-sm disabled:opacity-60 active:scale-95 transition-all"
      style={{ background: 'var(--primary)' }}
    >
      {loading ? 'Updating…' : action.label}
    </button>
  )
}
