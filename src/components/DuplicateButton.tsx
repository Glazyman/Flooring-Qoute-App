'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DuplicateButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.id) {
        router.push(`/quotes/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
      style={{ background: 'white', border: '1px solid #E5E7EB' }}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {loading ? 'Duplicating…' : 'Duplicate'}
    </button>
  )
}
