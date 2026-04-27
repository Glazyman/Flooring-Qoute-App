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
  lost: { bg: '#fef2f2', text: '#dc2626', label: 'Lost' },
}

function StatusBadge({ status }: { status: QuoteStatus }) {
  const s = STATUS_CONFIG[status]
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

export default function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
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

  if (localQuotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900 mb-1">No quotes yet</p>
        <p className="text-gray-400 text-sm">Create your first quote to get started.</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Area</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {localQuotes.map((q, idx) => (
              <tr
                key={q.id}
                className={`transition-colors hover:bg-gray-50 ${idx < localQuotes.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <td className="px-5 py-4">
                  <p className="font-semibold text-gray-900">{q.customer_name}</p>
                  {q.job_address && (
                    <p className="text-xs text-gray-400 truncate max-w-44 mt-0.5">{q.job_address}</p>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="capitalize text-gray-600 text-sm">{q.flooring_type}</span>
                </td>
                <td className="px-5 py-4 text-gray-600 text-sm">
                  {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                </td>
                <td className="px-5 py-4 text-right font-bold text-gray-900">
                  {fmt(q.final_total)}
                </td>
                <td className="px-5 py-4">
                  <div className="relative inline-block">
                    <select
                      value={q.status}
                      onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                      disabled={updating === q.id}
                      className="appearance-none text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer focus:outline-none border-0 pr-6"
                      style={{
                        background: STATUS_CONFIG[q.status].bg,
                        color: STATUS_CONFIG[q.status].text,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs">
                  {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => router.push(`/quotes/${q.id}`)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {localQuotes.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{q.customer_name}</p>
                {q.job_address && <p className="text-xs text-gray-400 mt-0.5">{q.job_address}</p>}
              </div>
              <StatusBadge status={q.status} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 capitalize">
                {q.flooring_type} · {Math.round(q.adjusted_sqft).toLocaleString()} sqft
              </span>
              <span className="text-base font-bold text-gray-900">{fmt(q.final_total)}</span>
            </div>
            <div className="flex gap-2">
              <select
                value={q.status}
                onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                disabled={updating === q.id}
                className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <button
                onClick={() => router.push(`/quotes/${q.id}`)}
                className="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
