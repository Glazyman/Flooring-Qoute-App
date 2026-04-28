'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel } from '@/lib/flooringLabels'
import type { Quote, QuoteStatus } from '@/lib/types'
import { Trash2, Square, CheckSquare, Search, X } from 'lucide-react'

interface QuotesTableProps {
  quotes: Quote[]
}

const STATUS_OPTIONS: QuoteStatus[] = ['pending', 'accepted', 'lost']

const STATUS_CONFIG: Record<QuoteStatus, { bg: string; text: string; label: string }> = {
  measurement: { bg: '#f0f9ff', text: '#0369a1', label: 'Measurement' },
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

type StatusFilter = 'all' | QuoteStatus

export default function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [localQuotes, setLocalQuotes] = useState(quotes)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Bulk state
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkStatusPicker, setBulkStatusPicker] = useState(false)

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

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === filteredQuotes.length ? new Set() : new Set(filteredQuotes.map(q => q.id)))
  }

  function exitSelect() {
    setSelecting(false)
    setSelected(new Set())
    setBulkStatusPicker(false)
  }

  async function bulkDelete() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    ))
    setLocalQuotes(prev => prev.filter(q => !selected.has(q.id)))
    exitSelect()
    setConfirmBulkDelete(false)
    setWorking(false)
    router.refresh()
  }

  async function bulkSetStatus(status: QuoteStatus) {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    ))
    setLocalQuotes(prev => prev.map(q => selected.has(q.id) ? { ...q, status } : q))
    exitSelect()
    setWorking(false)
  }

  const q = search.trim().toLowerCase()
  const filteredQuotes = localQuotes.filter(quote => {
    if (statusFilter !== 'all' && quote.status !== statusFilter) return false
    if (!q) return true
    const label = flooringTypeLabel(quote.flooring_type, quote.section_flooring_types).toLowerCase()
    return (
      quote.customer_name.toLowerCase().includes(q) ||
      (quote.job_address || '').toLowerCase().includes(q) ||
      label.includes(q) ||
      (quote.flooring_type || '').toLowerCase().includes(q)
    )
  })

  const selCount = selected.size
  const allSelected = filteredQuotes.length > 0 && selCount === filteredQuotes.length

  if (localQuotes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-14 text-center" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
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
      {/* Confirm single delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
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

      {/* Confirm bulk delete */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>
              Delete {selCount} estimate{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="flex-1 border font-semibold text-sm py-3 rounded-2xl"
                style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={working}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-2xl disabled:opacity-50"
              >
                {working ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + filter pills */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2 flex-1" style={{ border: '1px solid var(--border)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, address, type…"
            className="flex-1 text-sm focus:outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500" type="button">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: '#f9f9fb', border: '1px solid var(--border)' }}>
          {(['all', 'pending', 'accepted', 'lost'] as StatusFilter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === f ? 'bg-white text-teal-700' : 'text-gray-500 hover:text-gray-700'
              }`}
              style={statusFilter === f ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } : undefined}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Select / select-all / bulk toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => selecting ? exitSelect() : setSelecting(true)}
          className={`text-sm font-semibold px-3.5 py-2 rounded-xl border transition-colors ${
            selecting
              ? 'bg-gray-100 border-gray-300 text-gray-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          {selecting ? 'Cancel' : 'Select'}
        </button>
        {selecting && (
          <button onClick={toggleAll} className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
        {selecting && selCount > 0 && (
          <>
            <span className="text-xs text-gray-400 font-medium">{selCount} selected</span>
            <div className="ml-auto flex items-center gap-2">
              {bulkStatusPicker ? (
                <>
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => bulkSetStatus(s)}
                      disabled={working}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                      style={{ background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].text, borderColor: STATUS_CONFIG[s].text + '40' }}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                  <button onClick={() => setBulkStatusPicker(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">✕</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setBulkStatusPicker(true)}
                    disabled={working}
                    className="text-xs font-medium text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors disabled:opacity-50"
                  >
                    Set Status
                  </button>
                  <button
                    onClick={() => setConfirmBulkDelete(true)}
                    disabled={working}
                    className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {selecting && (
                <th className="px-5 py-4 w-10">
                  <button onClick={toggleAll}>
                    {allSelected
                      ? <CheckSquare className="w-4 h-4 text-teal-600" />
                      : <Square className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                </th>
              )}
              {['Customer', 'Type', 'Area', 'Total', 'Status', 'Date', ''].map((h) => (
                <th key={h} className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-widest ${h === 'Total' ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-3)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map((q, idx) => {
              const isSelected = selected.has(q.id)
              return (
                <tr
                  key={q.id}
                  className="transition-colors hover:bg-gray-50"
                  style={{
                    borderBottom: idx < filteredQuotes.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isSelected ? '#f0fdf4' : undefined,
                  }}
                >
                  {selecting && (
                    <td className="px-5 py-4">
                      <button onClick={() => toggleSelect(q.id)}>
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-teal-600" />
                          : <Square className="w-4 h-4 text-gray-300" />
                        }
                      </button>
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                    {q.job_address && <p className="text-xs truncate max-w-44 mt-0.5" style={{ color: 'var(--text-3)' }}>{q.job_address}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm" style={{ color: 'var(--text-2)' }}>{flooringTypeLabel(q.flooring_type, q.section_flooring_types)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text-2)' }}>
                    {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-sm" style={{ color: 'var(--text)' }}>
                    {fmt(q.final_total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={q.status}
                      onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                      disabled={updating === q.id || selecting}
                      className="appearance-none text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer focus:outline-none border-0 pr-6"
                      style={{ background: STATUS_CONFIG[q.status].bg, color: STATUS_CONFIG[q.status].text }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--text-3)' }}>
                    {new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => router.push(`/quotes/${q.id}`)} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                        View →
                      </button>
                      {!selecting && (
                        <button onClick={() => setConfirmDelete(q.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile rows */}
      <div className="md:hidden bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {filteredQuotes.map((q, idx) => {
          const isSelected = selected.has(q.id)
          return (
            <div
              key={q.id}
              className="transition-colors"
              style={{
                borderBottom: idx < filteredQuotes.length - 1 ? '1px solid var(--border)' : 'none',
                background: isSelected ? '#F0FDFA' : undefined,
              }}
            >
              {selecting ? (
                <button onClick={() => toggleSelect(q.id)} className="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-gray-50">
                  {isSelected
                    ? <CheckSquare className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    : <Square className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {flooringTypeLabel(q.flooring_type, q.section_flooring_types)} · {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</p>
                    <StatusBadge status={q.status} />
                  </div>
                </button>
              ) : (
                <div className="flex items-center px-4 py-3 gap-3">
                  <button onClick={() => router.push(`/quotes/${q.id}`)} className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {flooringTypeLabel(q.flooring_type, q.section_flooring_types)} · {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                    </p>
                  </button>
                  <div className="text-right flex-shrink-0 mr-1">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</p>
                    <select
                      value={q.status}
                      onChange={(e) => updateStatus(q.id, e.target.value as QuoteStatus)}
                      disabled={updating === q.id}
                      className="text-xs font-semibold rounded-full px-2 py-0.5 mt-0.5 focus:outline-none border-0 appearance-none"
                      style={{ background: STATUS_CONFIG[q.status].bg, color: STATUS_CONFIG[q.status].text }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => setConfirmDelete(q.id)} className="p-2 text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </>
  )
}
