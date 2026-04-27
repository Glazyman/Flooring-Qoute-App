'use client'

import { useState } from 'react'

interface Props {
  quoteId: string
  customerEmail: string | null
}

export default function EmailQuoteButton({ quoteId, customerEmail }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const emailIcon = (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )

  if (!customerEmail) {
    return (
      <button disabled
        className="flex items-center justify-center gap-1.5 font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm cursor-not-allowed focus:outline-none"
        style={{ background: '#e5e7eb', color: '#9ca3af' }}
        title="No email address on file for this customer"
      >
        {emailIcon}
        No Email
      </button>
    )
  }

  async function handleSend() {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/quotes/${quoteId}/email`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send')
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      } else {
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setErrorMsg('Network error')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  if (status === 'sent') {
    return (
      <button disabled
        className="flex items-center justify-center gap-1.5 font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm focus:outline-none"
        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Sent!
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button onClick={handleSend}
        className="flex items-center justify-center gap-1.5 font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm focus:outline-none active:scale-95"
        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
        title={errorMsg}
      >
        {emailIcon}
        {errorMsg.length > 20 ? 'Failed — tap to retry' : errorMsg}
      </button>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === 'sending'}
      className="flex items-center justify-center gap-1.5 text-white font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm active:scale-95 transition-transform focus:outline-none disabled:opacity-70"
      style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
    >
      {status === 'sending' ? (
        <>
          <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Sending…
        </>
      ) : (
        <>
          {emailIcon}
          Email Customer
        </>
      )}
    </button>
  )
}
