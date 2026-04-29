'use client'

import { useEffect, useState } from 'react'

export default function QuoteDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    // Best-effort logging — landing on the boundary already implies the
    // server-rendered page threw. Surface enough info to debug from the
    // client console without leaking internals.
    console.error('[quotes/[id]] route error', {
      message: error?.message,
      digest: error?.digest,
    })
  }, [error])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await fetch('/auth/signout', { method: 'POST', credentials: 'include' })
    } catch {
      // Even if the request fails, fall through to a hard reload at /login
      // which the proxy will repair-by-redirect on the next request.
    }
    window.location.href = '/login'
  }

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center px-6"
    >
      <div
        className="max-w-md w-full bg-white rounded-xl p-8 text-center"
        style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
      >
        <div
          className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: '#fef2f2' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#0f172a' }}>
          Something went wrong loading this quote
        </h2>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>
          This is usually a temporary glitch. Try again in a moment — if it
          keeps happening, sign out and back in to refresh your session.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="text-sm font-medium px-4 py-2 rounded-md text-white transition-colors"
            style={{ background: '#1d1d1f' }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium px-4 py-2 rounded-md transition-colors"
            style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            Reload page
          </button>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-sm font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569' }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}
