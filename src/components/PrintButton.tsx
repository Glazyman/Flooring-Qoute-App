'use client'

import { useState } from 'react'

export default function PrintButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false)

  async function handlePrint() {
    setLoading(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/pdf`)
      if (!res.ok) throw new Error('Failed to load PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.src = url
      document.body.appendChild(iframe)

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          window.open(url, '_blank')
        }
      }
    } catch {
      alert('Could not load PDF for printing.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
      style={{ border: '1px solid #E5E7EB', background: 'white' }}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      {loading ? 'Loading…' : 'Print'}
    </button>
  )
}
