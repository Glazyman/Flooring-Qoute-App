'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const msg = String(error?.message || '')
    const isChunkError =
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Importing a module script failed')
    if (isChunkError) {
      window.location.reload()
    }
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#f8fafc' }}
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
          Something went wrong
        </h2>
        <p className="text-sm mb-6" style={{ color: '#64748b' }}>
          We hit a snag loading this page. Try again — most issues clear up immediately.
        </p>
        <div className="flex gap-2 justify-center">
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
        </div>
      </div>
    </div>
  )
}
