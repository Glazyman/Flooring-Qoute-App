'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Props {
  quoteId: string
  customerEmail: string | null
  emailConnected: boolean
}

export default function EmailQuoteButton({ quoteId, customerEmail, emailConnected }: Props) {
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
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md cursor-not-allowed text-gray-400"
        style={{ background: '#F5F5F7', border: '1px solid #E5E7EB' }}
        title="No email address on file for this customer"
      >
        {emailIcon}
        No email
      </button>
    )
  }

  if (!emailConnected) {
    return (
      <Link
        href="/settings?tab=email"
        className="inline-flex items-center justify-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
        style={{ background: 'var(--button-dark)' }}
        title="Connect a Gmail account in Settings to send quotes"
      >
        {emailIcon}
        Set up email
      </Link>
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
      } else {
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setErrorMsg('Network error')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <button disabled
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md"
        style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Sent
      </button>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-white"
          style={{ background: 'var(--danger)' }}
          onClick={handleSend}
        >
          {emailIcon}
          Retry email
        </button>
        <p className="text-xs leading-snug break-words" style={{ color: 'var(--danger)' }}>
          {errorMsg}
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === 'sending'}
      className="inline-flex items-center justify-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors disabled:opacity-70"
      style={{ background: 'var(--button-dark)' }}
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
          Send email
        </>
      )}
    </button>
  )
}
