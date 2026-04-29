'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

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
  const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe(plan: 'starter' | 'pro') {
    setLoadingPlan(plan)
    setError('')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing: annual ? 'annual' : 'monthly' }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (data.url) {
        setLoadingPlan(null)
        setRedirectingPlan(plan)
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoadingPlan(null)
      }
    } catch (err) {
      clearTimeout(timeout)
      if ((err as Error).name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        setError('Could not connect to billing. Please try again.')
      }
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Could not open billing portal.')
        setPortalLoading(false)
      }
    } catch {
      setError('Could not connect to billing portal. Please try again.')
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
          <Image src="/logo.png" alt="FloorQuote Pro" width={96} height={96} className="mx-auto mb-4 rounded-xl" />
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
              disabled={loadingPlan !== null || redirectingPlan !== null}
              className="w-full border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold py-3 px-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loadingPlan === 'starter' && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingPlan === 'starter' ? 'Setting up checkout…' : redirectingPlan === 'starter' ? 'Redirecting to Stripe…' : 'Subscribe to Starter'}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl p-6 flex flex-col relative overflow-hidden" style={{ background: 'var(--primary)', boxShadow: '0 8px 30px rgba(0,113,227,0.25)' }}>
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
              disabled={loadingPlan !== null || redirectingPlan !== null}
              className="w-full bg-white hover:bg-gray-50 disabled:opacity-50 font-bold py-3 px-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
              style={{ color: 'var(--button-dark)' }}
            >
              {loadingPlan === 'pro' && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />}
              {loadingPlan === 'pro' ? 'Setting up checkout…' : redirectingPlan === 'pro' ? 'Redirecting to Stripe…' : 'Subscribe to Pro'}
            </button>
          </div>
        </div>

        {/* Manage / nav links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center gap-3 justify-between">
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {portalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {portalLoading ? 'Opening portal…' : 'Manage existing subscription'}
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
