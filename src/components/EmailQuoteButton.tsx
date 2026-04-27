'use client'

import { useState } from 'react'

interface Props {
  quoteId: string
  customerEmail: string | null
}

export default function EmailQuoteButton({ quoteId, customerEmail }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!customerEmail) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 cursor-not-allowed"
        style={{ background: '#e5e7eb', color: '#9ca3af' }}
        title="No email address on file for this customer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        No Email on File
      </button>
    )
  }

  const handleClick = async () => {
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/quotes/${quoteId}/email`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok || json.error) {
        setErrorMsg(json.error || 'Failed to send')
        setState('error')
        setTimeout(() => setState('idle'), 3000)
      } else {
        setState('success')
        setTimeout(() => setState('idle'), 2000)
      }
    } catch {
      setErrorMsg('Network error')
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (state === 'success') {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0"
        style={{ background: '#16a34a', color: '#fff' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Sent!
      </button>
    )
  }

  if (state === 'error') {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95 transition-transform"
        style={{ background: '#dc2626', color: '#fff' }}
        title={errorMsg}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {errorMsg.length > 20 ? 'Error – retry?' : errorMsg || 'Error – retry?'}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
      style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
    >
      {state === 'loading' ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Sending…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Customer
        </>
      )}
    </button>
  )
}
