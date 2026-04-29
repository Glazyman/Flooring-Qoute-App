'use client'

import { useState } from 'react'
import Link from 'next/link'

const STARTER_FEATURES = [
  '25 quotes / month',
  'PDF export',
  'Contact management',
  'Email quotes',
  'Duplicate quotes',
]

const PRO_FEATURES = [
  'Everything in Starter',
  'Unlimited quotes',
  'AI blueprint scan',
]

const BUSINESS_FEATURES = [
  'Everything in Pro',
  'Custom integrations',
  'Priority support',
  'Dedicated onboarding',
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CheckIconWhite() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Pricing</p>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Simple, honest pricing</h2>
        <p className="text-base sm:text-lg text-gray-400 mt-3">Start free. Upgrade when you need more.</p>

        {/* Monthly / Annual toggle */}
        <div className="inline-flex items-center gap-3 mt-8 bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Annual
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,113,227,0.12)', color: 'var(--primary)' }}>
              Save 17%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">

        {/* Starter */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Starter</p>
          {annual ? (
            <>
              <p className="text-4xl font-extrabold text-gray-900 mb-0.5">$19.99<span className="text-xl font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-1">$239.88 billed annually</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-extrabold text-gray-900 mb-0.5">$23.99<span className="text-xl font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-1">Billed monthly</p>
            </>
          )}
          <p className="text-xs text-teal-600 font-semibold mb-7">3 free quotes to start</p>
          <ul className="space-y-3 mb-8 flex-1">
            {STARTER_FEATURES.map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="block text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            Start Free
          </Link>
        </div>

        {/* Pro — highlighted */}
        <div className="rounded-xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col" style={{ background: 'var(--primary)', boxShadow: '0 8px 30px rgba(0,113,227,0.3)' }}>
          <div className="absolute top-5 right-5 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Most Popular</div>
          <p className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-3">Pro</p>
          {annual ? (
            <>
              <p className="text-4xl font-extrabold mb-0.5">$32.99<span className="text-xl font-normal text-teal-200">/mo</span></p>
              <p className="text-sm text-teal-200 mb-1">$395.88 billed annually</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-extrabold mb-0.5">$39.99<span className="text-xl font-normal text-teal-200">/mo</span></p>
              <p className="text-sm text-teal-200 mb-1">Billed monthly</p>
            </>
          )}
          <p className="text-xs text-teal-200 font-semibold mb-7">3 free quotes to start</p>
          <ul className="space-y-3 mb-8 flex-1">
            {PRO_FEATURES.map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-white">
                <CheckIconWhite />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="block text-center bg-white font-bold py-3.5 rounded-2xl text-sm transition-colors hover:bg-gray-50"
            style={{ color: 'var(--button-dark)' }}
          >
            Start Free
          </Link>
        </div>

        {/* Business */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Business</p>
          <p className="text-4xl font-extrabold text-gray-900 mb-0.5">Custom</p>
          <p className="text-sm text-gray-400 mb-1">Contact us for pricing</p>
          <p className="text-xs text-gray-300 font-semibold mb-7">&nbsp;</p>
          <ul className="space-y-3 mb-8 flex-1">
            {BUSINESS_FEATURES.map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <CheckIcon />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="block text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            Let&apos;s Talk
          </Link>
        </div>

      </div>
    </section>
  )
}
