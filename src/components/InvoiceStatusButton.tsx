'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InvoiceStatus } from '@/lib/types'

const NEXT_STATUS: Record<InvoiceStatus, { label: string; next: InvoiceStatus } | null> = {
  draft: { label: 'Mark as sent', next: 'sent' },
  sent: { label: 'Mark as paid', next: 'paid' },
  paid: null,
  overdue: { label: 'Mark as paid', next: 'paid' },
  void: null,
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
      className="text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors disabled:opacity-60"
      style={{ background: 'var(--button-dark)' }}
    >
      {loading ? 'Updating…' : action.label}
    </button>
  )
}
