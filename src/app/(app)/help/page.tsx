'use client'

import { useState } from 'react'
import { HelpCircle, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'

const FORMSPREE_ID = 'meevwpea'

const FAQS = [
  {
    q: 'How do I create a new quote?',
    a: 'Click "New Quote" in the sidebar or the + button on the dashboard. Fill in customer details, add rooms for upstairs and/or downstairs, set your pricing, then save as a measurement or approve it as an estimate.',
  },
  {
    q: 'What is the difference between Saved Measurements and Estimates?',
    a: 'Saved Measurements are draft quotes you\'ve filled out but haven\'t approved yet. Once you click Approve, they move to Estimates where you can send them to customers and track their status.',
  },
  {
    q: 'How do I set default pricing for each material type?',
    a: 'Go to Settings → Pricing by Material. You can set default material and labor costs per square foot for each flooring type (Hardwood, LVT/Vinyl, Tile, etc.). These will auto-fill when you select that flooring type on a new quote.',
  },
  {
    q: 'How do I send a quote to a customer?',
    a: 'Open an estimate, then click the Email button. Enter the customer\'s email address and they\'ll receive a professional PDF of the quote.',
  },
  {
    q: 'Can I import contacts from QuickBooks?',
    a: 'Yes. Go to Contacts and click the import icon. Export your customer list from QuickBooks as a CSV file, then upload it here.',
  },
  {
    q: 'How do I upgrade my plan?',
    a: 'Click "Billing" in the sidebar to manage your subscription. You can upgrade, downgrade, or cancel at any time.',
  },
  {
    q: 'How does the free trial work?',
    a: 'You get 3 free quotes. After that, click Billing in the sidebar to upgrade. You can cancel anytime from the customer portal.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Click Billing in the sidebar to open the Stripe customer portal where you can pause or cancel your subscription anytime.',
  },
]

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="cursor-pointer"
      style={{ borderBottom: '1px solid #F1F1F4' }}
      onClick={() => setOpen(v => !v)}
    >
      <div className="flex items-center justify-between py-4 gap-3">
        <p className="text-sm font-medium text-gray-900">{q}</p>
        {open
          ? <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
          : <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
        }
      </div>
      {open && (
        <p className="text-sm pb-4 leading-relaxed text-gray-600">{a}</p>
      )}
    </div>
  )
}

export default function HelpPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    formData.forEach((v, k) => { data[k] = v.toString() })

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

  return (
    <div className="space-y-5">
      <h1 className="text-base font-semibold text-gray-900">Help &amp; support</h1>

      {/* Contact form */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F1F4' }}>
          <MessageSquare className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Send us a message</h2>
        </div>

        <div className="p-5">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--success-bg)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1 text-gray-900">Message sent</p>
              <p className="text-sm mb-4 text-gray-500">We&apos;ll get back to you within 1 business day.</p>
              <button onClick={() => setStatus('idle')} className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input
                    name="name" required placeholder="Your name"
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none placeholder-gray-400 bg-white text-gray-900"
                    style={{ border: '1px solid #E5E7EB' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                  <input
                    name="email" type="email" required placeholder="you@email.com" inputMode="email"
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none placeholder-gray-400 bg-white text-gray-900"
                    style={{ border: '1px solid #E5E7EB' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Topic *</label>
                <select
                  name="subject" required
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none bg-white text-gray-900"
                  style={{ border: '1px solid #E5E7EB' }}
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Message *</label>
                <textarea
                  name="message" required rows={4} placeholder="How can we help?"
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none placeholder-gray-400 resize-none min-h-[80px] bg-white text-gray-900"
                  style={{ border: '1px solid #E5E7EB' }}
                />
              </div>

              {status === 'error' && (
                <p className="text-sm bg-white rounded-md px-4 py-3" style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}>{errorMsg}</p>
              )}

              <button
                type="submit" disabled={status === 'sending'}
                className="text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'var(--button-dark)' }}
              >
                {status === 'sending' ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</>
                ) : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F1F4' }}>
          <HelpCircle className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Frequently asked questions</h2>
        </div>
        <div className="px-5">
          {FAQS.map(faq => <FAQ key={faq.q} {...faq} />)}
        </div>
      </div>
    </div>
  )
}
