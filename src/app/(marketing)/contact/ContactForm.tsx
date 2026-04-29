'use client'

import { useState } from 'react'

const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || 'meevwpea'

interface Prefill {
  name: string
  email: string
  company: string
  accountId: string
}

export default function ContactForm({ prefill }: { prefill: Prefill }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [name, setName] = useState(prefill.name)
  const [email, setEmail] = useState(prefill.email)
  const [company, setCompany] = useState(prefill.company)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const form = e.currentTarget
    const formData = new FormData(form)
    const data: Record<string, string> = {}
    formData.forEach((v, k) => { data[k] = v.toString() })

    // Always include account metadata so you know who sent it
    if (prefill.accountId) {
      data['_account_id'] = prefill.accountId
      data['_account_email'] = prefill.email
      data['_account_company'] = prefill.company
    }

    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      setStatus('success')
      form.reset()
    } else {
      const body = await res.json().catch(() => ({}))
      setErrorMsg(body?.errors?.[0]?.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Message sent!</h2>
        <p className="text-gray-500 mb-6">Thanks for reaching out. We&apos;ll get back to you within 1 business day.</p>
        <button onClick={() => setStatus('idle')} className="text-sm font-semibold text-teal-600 hover:text-teal-700">
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-5">

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Company / Business Name
        </label>
        <input
          name="company"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Farkas Flooring"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          What can we help with? <span className="text-red-400">*</span>
        </label>
        <select
          name="subject"
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us what you need…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300 resize-none"
        />
      </div>

      {status === 'error' && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        {status === 'sending' ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send Message
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        We typically respond within 1 business day.
      </p>
    </form>
  )
}
