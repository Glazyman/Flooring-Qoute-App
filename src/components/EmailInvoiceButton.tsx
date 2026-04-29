'use client'

import { useState } from 'react'

interface Props {
  invoiceId: string
  customerEmail: string | null
}

const emailIcon = (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

export default function EmailInvoiceButton({ invoiceId, customerEmail }: Props) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(customerEmail ?? '')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSend() {
    if (!to.trim()) {
      setErrorMsg('Email address is required')
      setStatus('error')
      return
    }
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to send')
        setStatus('error')
      } else {
        setStatus('sent')
        setTimeout(() => {
          setStatus('idle')
          setOpen(false)
        }, 2500)
      }
    } catch {
      setErrorMsg('Network error')
      setStatus('error')
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        style={{ background: 'white', border: '1px solid #E5E7EB' }}
      >
        {emailIcon}
        Email invoice
      </button>
    )
  }

  return (
    <div
      className="bg-white rounded-xl p-4 w-full sm:w-auto sm:min-w-[320px] flex flex-col gap-2"
      style={{ border: '1px solid var(--border)' }}
    >
      <label className="text-xs font-medium text-gray-500 mb-1">
        Send invoice to
      </label>
      <input
        type="email"
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="customer@example.com"
        autoFocus
        className="px-3 py-2 rounded-md text-sm focus:outline-none placeholder-gray-400 bg-white text-gray-900"
        style={{ border: '1px solid #E5E7EB' }}
      />
      {status === 'sent' ? (
        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--success)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Sent
        </p>
      ) : (
        <>
          {errorMsg && (
            <p className="text-xs leading-snug break-words" style={{ color: 'var(--danger)' }}>{errorMsg}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={status === 'sending'}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors disabled:opacity-70"
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
                  Send
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setStatus('idle'); setErrorMsg('') }}
              disabled={status === 'sending'}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
