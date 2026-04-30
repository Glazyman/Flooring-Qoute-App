'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import type { Quote } from '@/lib/types'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'

const PAGE_SIZE = 10
const COL_TEMPLATE = '32px 1fr 110px 90px 100px 120px 110px'

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
      {/* Confirm bulk delete modal */}
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

      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900">Measurements</h1>
        <Link
          href="/quotes/new"
          className="lg:hidden inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl text-white flex-shrink-0"
          style={{ background: 'var(--button-dark)' }}
        >
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #F1F1F4' }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #F5F5F7' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {items.length} measurement{items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={toggleSelectAllVisible}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {selCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2 bg-gray-50"
            style={{ borderBottom: '1px solid #F5F5F7' }}
          >
            <span className="text-xs text-gray-600">{selCount} selected</span>
            <button
              onClick={bulkApprove}
              disabled={working}
              className="text-xs font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={working}
              className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 ml-auto transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400 mb-3">No measurements yet</p>
            <Link
              href="/quotes/new"
              className="text-sm font-medium text-white px-4 py-2 rounded-md"
              style={{ background: '#1d1d1f' }}
            >
              + New Project
            </Link>
          </div>
        ) : (
          <>
            {/* Column headers — desktop only */}
            <div
              style={{ gridTemplateColumns: COL_TEMPLATE, borderBottom: '1px solid #F5F5F7' }}
              className="hidden sm:grid bg-white px-4 py-2.5 items-center"
            >
              <div>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="w-3.5 h-3.5 cursor-pointer"
                  style={{ accentColor: '#1C1C1E' }}
                  aria-label="Select all"
                />
              </div>
              <div className="text-xs text-gray-400 font-normal">Customer</div>
              <div className="text-xs text-gray-400 font-normal">Type</div>
              <div className="text-xs text-gray-400 font-normal">Area</div>
              <div className="text-xs text-gray-400 font-normal">Total</div>
              <div className="text-xs text-gray-400 font-normal flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Date
              </div>
              <div />
            </div>

            {/* Rows */}
            {paginated.map(m => {
              const isSelected = selected.has(m.id)
              const initials = (m.customer_name || '?').charAt(0).toUpperCase()

              return (
                <div key={m.id}>
                  {/* Mobile row — hidden sm+ */}
                  <div
                    className="sm:hidden flex items-center gap-3 px-4 py-3 cursor-pointer"
                    style={{ borderBottom: '1px solid #F5F5F7', background: isSelected ? 'rgba(239,246,255,0.4)' : undefined }}
                    onClick={() => router.push(`/quotes/${m.id}`)}
                  >
                    {/* Name */}
                    <p className="flex-1 min-w-0 text-sm font-semibold text-gray-900 truncate">{m.customer_name || '—'}</p>

                    {/* Price */}
                    <p className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">{fmt(m.final_total)}</p>

                    {/* Approve */}
                    <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
                      <ApproveMeasurementButton
                        quoteId={m.id}
                        onApprove={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                      />
                    </div>
                  </div>

                  {/* Desktop grid row — hidden on mobile */}
                  <div
                    className="hidden sm:grid group px-4 py-3 items-center hover:bg-gray-50/60 transition-colors cursor-pointer"
                    style={{
                      gridTemplateColumns: COL_TEMPLATE,
                      borderBottom: '1px solid #F5F5F7',
                      background: isSelected ? 'rgba(239,246,255,0.4)' : undefined,
                    }}
                    onClick={() => router.push(`/quotes/${m.id}`)}
                  >
                    {/* Checkbox */}
                    <div onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(m.id)}
                        className="w-3.5 h-3.5 cursor-pointer"
                        style={{ accentColor: '#1C1C1E' }}
                        aria-label={`Select ${m.customer_name}`}
                      />
                    </div>

                    {/* Customer: avatar + name + address */}
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                        style={{ background: '#E5E7EB' }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-normal text-gray-800 truncate">{m.customer_name}</p>
                        {m.job_address && (
                          <p className="text-xs text-gray-400 truncate">{m.job_address}</p>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="text-sm text-gray-600 truncate pr-2">
                      {m.flooring_type || <span className="text-gray-300">—</span>}
                    </div>

                    {/* Area */}
                    <div className="text-sm text-gray-600 pr-2">
                      {m.adjusted_sqft.toFixed(0)} sqft
                    </div>

                    {/* Total */}
                    <div className="text-sm font-medium text-gray-800 pr-2">
                      {fmt(m.final_total)}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{fmtDate(m.created_at)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
                      <ApproveMeasurementButton
                        quoteId={m.id}
                        onApprove={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                      />
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
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
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
    </div>
  )
}
