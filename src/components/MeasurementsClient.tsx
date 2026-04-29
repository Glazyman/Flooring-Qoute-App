'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import type { Quote } from '@/lib/types'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'

const PAGE_SIZE = 10

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MeasurementsClient({ initialMeasurements }: { initialMeasurements: Quote[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialMeasurements)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [page, setPage] = useState(1)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkApprove() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
    ))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setSelected(new Set())
    setWorking(false)
    router.refresh()
  }

  async function bulkDelete() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    ))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setSelected(new Set())
    setConfirmDelete(false)
    setWorking(false)
    router.refresh()
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])

  const paginated = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  )

  const visibleIds = paginated.map(i => i.id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id))

  function toggleSelectAllVisible() {
    setSelected(prev => {
      if (allVisibleSelected) {
        const next = new Set(prev)
        for (const id of visibleIds) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of visibleIds) next.add(id)
      return next
    })
  }

  const selCount = selected.size

  const pageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  return (
    <div className="space-y-5">
      {/* Confirm bulk delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Delete {selCount} measurement{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm font-medium px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={working}
                className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
                style={{ background: 'var(--danger)' }}
              >
                {working ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900">Measurements</h1>
        <Link
          href="/quotes/new"
          className="flex items-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center" style={{ border: '1px solid #F1F1F4' }}>
          <p className="text-sm text-gray-500 mb-3">No measurements yet</p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-white transition-colors"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Quote
          </Link>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selCount > 0 && (
                <span className="text-xs text-gray-500">{selCount} selected</span>
              )}
              {selCount > 0 && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  <button
                    onClick={bulkApprove}
                    disabled={working}
                    className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={working}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={toggleSelectAllVisible}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {allVisibleSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {paginated.map(m => {
              const isSelected = selected.has(m.id)
              const initials = (m.customer_name || '?').charAt(0).toUpperCase()

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl px-4 py-3.5 flex items-start gap-3 hover:border-gray-300 transition-colors"
                  style={{
                    border: isSelected ? '1px solid #1C1C1E' : '1px solid #F1F1F4',
                    background: isSelected ? 'rgba(239,246,255,0.4)' : 'white',
                  }}
                >
                  {/* Checkbox */}
                  <div className="pt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(m.id)}
                      className="w-3.5 h-3.5 cursor-pointer accent-[#1C1C1E]"
                    />
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-gray-700 text-xs font-semibold"
                    style={{ background: '#E5E7EB' }}
                  >
                    {initials}
                  </div>

                  {/* Main content */}
                  <Link href={`/quotes/${m.id}/edit`} className="flex-1 min-w-0">
                    {/* Line 1: name · address */}
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {m.customer_name}
                      {m.job_address && (
                        <span className="font-normal text-gray-400"> · {m.job_address}</span>
                      )}
                    </p>
                    {/* Line 2: flooring type · sqft */}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.flooring_type || '—'} · {m.adjusted_sqft.toFixed(0)} sqft
                    </p>
                    {/* Line 3: date */}
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {fmtDate(m.created_at)}
                    </p>
                  </Link>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-900">{fmt(m.final_total)}</span>
                    <ApproveMeasurementButton
                      quoteId={m.id}
                      onApprove={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md text-xs flex items-center justify-center transition-colors ${
                    p === page
                      ? 'bg-gray-200 text-gray-900 font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
