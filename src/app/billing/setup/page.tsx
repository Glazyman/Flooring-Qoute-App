'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/billing/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || 'Something went wrong')
      setLoading(false)
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

  const features = [
    'Unlimited quotes',
    'Professional PDF estimates',
    'Customer management',
    'Dashboard & analytics',
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FloorQuote Pro</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1.5">Activate your subscription</h2>
            <p className="text-sm text-gray-400">
              You&apos;ve used your 3 free quotes. Subscribe to create unlimited estimates.
            </p>
          </div>

          {/* Pricing card */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
            <div className="flex items-end justify-between mb-4">
              <span className="font-bold text-gray-900">FloorQuote Pro</span>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-900">$1</span>
                <span className="text-sm text-gray-400">/month</span>
              </div>
            </div>
            <ul className="space-y-2.5">
              {features.map((feat) => (
                <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-colors shadow-sm mb-3"
          >
            {loading ? 'Redirecting to checkout…' : 'Subscribe for $1/month'}
          </button>

          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-medium py-3 px-4 rounded-2xl text-sm transition-colors mb-4"
          >
            {portalLoading ? 'Loading…' : 'Manage existing subscription'}
          </button>

          <p className="text-center">
            <button onClick={handleLogout} className="text-gray-300 hover:text-gray-500 text-xs transition-colors">
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
