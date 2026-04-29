'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import type { Quote } from '@/lib/types'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'

const PAGE_SIZE = 10

const COL_TEMPLATE = '32px 1fr 110px 100px 110px 130px'
const COL_HEAD = 'text-xs text-gray-400 font-normal'

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
        <div
          className="bg-white rounded-xl py-16 text-center"
          style={{ border: '1px solid var(--border)' }}
        >
          <p className="text-sm text-gray-500 mb-2">No saved measurements</p>
          <p className="text-xs text-gray-400 mb-4">When you create a new quote, it saves here first.</p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Take measurements
          </Link>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ border: '1px solid #E5E7EB' }}
        >
          {/* Bulk action bar */}
          {selCount > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-2 text-xs text-gray-600"
              style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F1F4' }}
            >
              <span>{selCount} selected</span>
              <span className="text-gray-300">·</span>
              <button
                onClick={bulkApprove}
                disabled={working}
                className="font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={working}
                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            </div>
          )}

          {/* Column headers — desktop */}
          <div
            style={{ gridTemplateColumns: COL_TEMPLATE, borderBottom: '1px solid #F1F1F4' }}
            className="hidden sm:grid bg-white px-4 py-2.5 items-center"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="w-3.5 h-3.5 cursor-pointer"
                style={{ accentColor: '#1C1C1E' }}
                aria-label="Select all"
              />
            </div>
            <div className={COL_HEAD}>Customer</div>
            <div className={COL_HEAD}>Type</div>
            <div className={COL_HEAD}>Area</div>
            <div className={`${COL_HEAD} text-right`}>Total</div>
            <div className={`${COL_HEAD} flex items-center`}>
              <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
              Date
            </div>
          </div>

          {paginated.map(m => {
            const isSelected = selected.has(m.id)
            const initials = (m.customer_name || '?').charAt(0).toUpperCase()
            const rowBg = isSelected ? 'rgba(239, 246, 255, 0.4)' : undefined

            return (
              <div key={m.id}>
                {/* Mobile */}
                <div
                  className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                  style={{ borderBottom: '1px solid #F5F5F7', background: rowBg }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(m.id)}
                    className="w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    style={{ accentColor: '#1C1C1E' }}
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0"
                    style={{ background: '#E5E7EB' }}
                  >
                    {initials}
                  </div>
                  <Link href={`/quotes/${m.id}/edit`} className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-gray-800 truncate">{m.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {m.flooring_type} · {m.adjusted_sqft.toFixed(0)} sqft · {fmtDate(m.created_at)}
                    </p>
                  </Link>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(m.final_total)}</p>
                    <ApproveMeasurementButton
                      quoteId={m.id}
                      onApprove={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                    />
                  </div>
                </div>

                {/* Desktop */}
                <div
                  style={{
                    gridTemplateColumns: COL_TEMPLATE,
                    background: rowBg,
                    borderBottom: '1px solid #F5F5F7',
                  }}
                  className="hidden sm:grid group px-4 py-3 items-center hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(m.id)}
                      className="w-3.5 h-3.5 cursor-pointer"
                      style={{ accentColor: '#1C1C1E' }}
                    />
                  </div>
                  <Link href={`/quotes/${m.id}/edit`} className="min-w-0 pr-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                        style={{ background: '#E5E7EB' }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-normal text-gray-800 truncate">{m.customer_name}</p>
                        {m.job_address && <p className="text-xs text-gray-400 truncate">{m.job_address}</p>}
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm text-gray-600 truncate pr-2">
                    {m.flooring_type || <span className="text-gray-300">—</span>}
                  </div>
                  <div className="text-sm text-gray-600 truncate pr-2">
                    {m.adjusted_sqft.toFixed(0)} sqft
                  </div>
                  <div className="text-sm font-semibold text-gray-900 text-right pr-2">
                    {fmt(m.final_total)}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{fmtDate(m.created_at)}</span>
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ApproveMeasurementButton
                        quoteId={m.id}
                        onApprove={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-end gap-1 px-4 py-3"
              style={{ borderTop: '1px solid #F1F1F4' }}
            >
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
        </div>
      )}
    </div>
  )
}
