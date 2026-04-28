'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const FORMSPREE_ID = 'meevwpea'

export default function ContactModal({
  open,
  onClose,
  prefill,
}: {
  open: boolean
  onClose: () => void
  prefill?: { email?: string; company?: string; accountId?: string }
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    formData.forEach((v, k) => { data[k] = v.toString() })

    if (prefill?.accountId) {
      data['_account_id'] = prefill.accountId
      data['_account_email'] = prefill.email || ''
      data['_account_company'] = prefill.company || ''
    }

    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      setStatus('success')
    } else {
      const body = await res.json().catch(() => ({}))
      setErrorMsg(body?.errors?.[0]?.message || 'Something went wrong.')
      setStatus('error')
    }
  }

  function handleClose() {
    setStatus('idle')
    setErrorMsg('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white w-full sm:w-[560px] sm:rounded-xl shadow-2xl flex flex-col rounded-t-3xl" style={{ maxHeight: '92dvh' }}>
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">Chat & Support</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">We reply within 1 business day</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 pb-8">
          {status === 'success' ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Message sent!</h3>
              <p className="text-sm text-slate-500 mb-5">We&apos;ll get back to you within 1 business day.</p>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm font-semibold text-teal-600 hover:text-teal-700"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Name *</label>
                  <input
                    name="name"
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-[16px] focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={prefill?.email || ''}
                    inputMode="email"
                    placeholder="you@email.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-[16px] focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Topic *</label>
                <select
                  name="subject"
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-[16px] focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">Select a topic…</option>
                  <option>General question</option>
                  <option>Pricing / Billing</option>
                  <option>Technical support</option>
                  <option>Feature request</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="How can we help?"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 text-[16px] focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300 resize-none bg-white"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full text-white font-bold py-4 rounded-2xl text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)' }}
              >
                {status === 'sending' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </>
                ) : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
