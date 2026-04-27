'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

function CheckIcon() {
  return (
    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
      <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

export default function BillingSetupPage() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe(plan: 'starter' | 'pro') {
    setLoadingPlan(plan)
    setError('')

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, billing: annual ? 'annual' : 'monthly' }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || 'Something went wrong')
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setPortalLoading(false)
    }
  }

  async function handleLogout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FloorQuote Pro</h1>
          <p className="text-gray-500 mt-1 text-sm">Choose a plan to keep quoting</p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-2xl p-1">
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
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">

          {/* Starter */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Starter</p>
            {annual ? (
              <div className="mb-1">
                <span className="text-3xl font-bold text-gray-900">$19.99</span>
                <span className="text-sm text-gray-400">/mo</span>
                <p className="text-xs text-gray-400 mt-0.5">$239.88 billed annually</p>
              </div>
            ) : (
              <div className="mb-1">
                <span className="text-3xl font-bold text-gray-900">$23.99</span>
                <span className="text-sm text-gray-400">/mo</span>
                <p className="text-xs text-gray-400 mt-0.5">Billed monthly</p>
              </div>
            )}
            <ul className="space-y-2 my-5 flex-1">
              {STARTER_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <CheckIcon />
                  {feat}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('starter')}
              disabled={loadingPlan !== null}
              className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold py-3 px-4 rounded-2xl text-sm transition-colors"
            >
              {loadingPlan === 'starter' ? 'Redirecting…' : 'Subscribe to Starter'}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden" style={{ background: 'var(--primary)', boxShadow: '0 8px 30px rgba(13,148,136,0.25)' }}>
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Most Popular</div>
            <p className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-2">Pro</p>
            {annual ? (
              <div className="mb-1">
                <span className="text-3xl font-bold text-white">$32.99</span>
                <span className="text-sm text-teal-200">/mo</span>
                <p className="text-xs text-teal-200 mt-0.5">$395.88 billed annually</p>
              </div>
            ) : (
              <div className="mb-1">
                <span className="text-3xl font-bold text-white">$39.99</span>
                <span className="text-sm text-teal-200">/mo</span>
                <p className="text-xs text-teal-200 mt-0.5">Billed monthly</p>
              </div>
            )}
            <ul className="space-y-2 my-5 flex-1">
              {PRO_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-2.5 text-sm text-white">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loadingPlan !== null}
              className="w-full bg-white hover:bg-teal-50 disabled:opacity-50 font-bold py-3 px-4 rounded-2xl text-sm transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              {loadingPlan === 'pro' ? 'Redirecting…' : 'Subscribe to Pro'}
            </button>
          </div>
        </div>

        {/* Manage / nav links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            {portalLoading ? 'Loading…' : 'Manage existing subscription'}
          </button>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
              ← Back to dashboard
            </Link>
            <span className="text-gray-200">·</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
