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
        className="flex items-center justify-center gap-1.5 font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm active:scale-95 transition-transform focus:outline-none"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {emailIcon}
        Email Invoice
      </button>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl p-4 w-full sm:w-auto sm:min-w-[320px] flex flex-col gap-2"
      style={{ border: '1px solid var(--border)' }}
    >
      <label className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
        Send invoice to
      </label>
      <input
        type="email"
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="customer@example.com"
        autoFocus
        className="px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
      />
      {status === 'sent' ? (
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#16a34a' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Sent!
        </p>
      ) : (
        <>
          {errorMsg && (
            <p className="text-xs leading-snug break-words" style={{ color: '#dc2626' }}>{errorMsg}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={status === 'sending'}
              className="flex-1 flex items-center justify-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95 disabled:opacity-70"
              style={{ background: 'var(--primary)' }}
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
              className="px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              style={{ color: 'var(--text-2)' }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
