'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/calculations'
import type { Quote, QuoteStatus } from '@/lib/types'

interface QuotesTableProps {
  quotes: Quote[]
}

const STATUS_OPTIONS: QuoteStatus[] = ['pending', 'accepted', 'lost']

const STATUS_CONFIG: Record<QuoteStatus, { bg: string; text: string; label: string }> = {
  accepted: { bg: '#f0fdf4', text: '#16a34a', label: 'Accepted' },
  pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
  lost: { bg: '#fff1f0', text: '#ff3b30', label: 'Lost' },
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const s = STATUS_CONFIG[status]
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

const avatarColor = '#1c1c1e'

export default function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [localQuotes, setLocalQuotes] = useState(quotes)

  async function updateStatus(quoteId: string, status: QuoteStatus) {
    setUpdating(quoteId)
    const res = await fetch(`/api/quotes/${quoteId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setLocalQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status } : q)))
    }
    setUpdating(null)
  }

  async function deleteQuote(quoteId: string) {
    setDeleting(quoteId)
    const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' })
    if (res.ok) {
      setLocalQuotes((prev) => prev.filter((q) => q.id !== quoteId))
    }
    setDeleting(null)
    setConfirmDelete(null)
    router.refresh()
  }

  if (localQuotes.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-14 text-center" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>No quotes yet</p>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Create your first quote to get started.</p>
      </div>
    )
  }

  return (
    <>
      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Delete quote?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This cannot be undone. The quote will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border font-semibold text-sm py-3 rounded-2xl transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: 'var(--bg)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteQuote(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-2xl transition-colors disabled:opacity-50"
              >
                {deleting === confirmDelete ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-3xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Customer', 'Type', 'Area', 'Total', 'Status', 'Date', ''].map((h) => (
                <th key={h} className={`px-5 py-4 text-[11px] font-bold uppercase tracking-widest ${h === 'Total' ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localQuotes.map((q, idx) => (
              <tr
                key={q.id}
                className="transition-colors hover:bg-gray-50"
                style={{ borderBottom: idx < localQuotes.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: avatarColor }}>
                      {(q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                      {q.job_address && <p className="text-xs truncate max-w-40 mt-0.5" style={{ color: 'var(--text-3)' }}>{q.job_address}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="capitalize text-sm" style={{ color: 'var(--text-2)' }}>{q.flooring_type}</span>
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-2)' }}>
                  {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                </td>
                <td className="px-5 py-4 text-right font-bold" style={{ color: 'var(--text)' }}>
                  {fmt(q.final_total)}
                </td>
                <td className="px-5 py-4">
                  <select
                    value={q.status}
                    onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                    disabled={updating === q.id}
                    className="appearance-none text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer focus:outline-none border-0 pr-6"
                    style={{ background: STATUS_CONFIG[q.status].bg, color: STATUS_CONFIG[q.status].text }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-3)' }}>
                  {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/quotes/${q.id}`)} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                      View →
                    </button>
                    <button onClick={() => setConfirmDelete(q.id)} className="text-gray-300 hover:text-red-400 transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {localQuotes.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
            {/* Tap to view */}
            <button
              onClick={() => router.push(`/quotes/${q.id}`)}
              className="w-full text-left p-4 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: avatarColor }}>
                  {(q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base leading-tight" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                  {q.job_address && <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-2)' }}>{q.job_address}</p>}
                </div>
                <StatusBadge status={q.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm capitalize" style={{ color: 'var(--text-2)' }}>
                  {q.flooring_type} · {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                </span>
                <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</span>
              </div>
            </button>

            {/* Actions */}
            <div className="flex gap-0" style={{ borderTop: '1px solid var(--border)' }}>
              <select
                value={q.status}
                onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                disabled={updating === q.id}
                className="flex-1 text-sm font-medium px-4 py-3.5 focus:outline-none"
                style={{ color: 'var(--text-2)', background: 'transparent', borderRight: '1px solid var(--border)' }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <button
                onClick={() => router.push(`/quotes/${q.id}`)}
                className="px-5 py-3.5 text-sm font-semibold transition-colors active:bg-teal-50"
                style={{ color: 'var(--primary)', borderRight: '1px solid var(--border)' }}
              >
                View
              </button>
              <button
                onClick={() => setConfirmDelete(q.id)}
                className="px-4 py-3.5 text-gray-300 hover:text-red-400 transition-colors active:bg-red-50"
                title="Delete quote"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
