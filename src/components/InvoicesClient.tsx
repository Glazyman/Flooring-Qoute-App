'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Invoice } from '@/lib/types'
import { Upload, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, Check } from 'lucide-react'

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  draft: { color: '#9CA3AF', label: 'Draft' },
  sent:  { color: '#6366F1', label: 'Sent' },
  paid:  { color: '#10B981', label: 'Paid' },
}

const PAGE_SIZE = 10

const COL_TEMPLATE = '32px 1fr 110px 130px 60px'
const COL_HEAD = 'text-xs text-gray-400 font-normal'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InvoicesClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialInvoices)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!openMenuId) return
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu-root]')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [openMenuId])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkDelete() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    ))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    setSelected(new Set())
    setConfirmDelete(false)
    setWorking(false)
    router.refresh()
  }

  async function bulkSetStatus(status: 'sent' | 'paid' | 'draft') {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    ))
    setItems(prev => prev.map(i => selected.has(i.id) ? { ...i, status } : i))
    setSelected(new Set())
    setWorking(false)
  }

  async function setStatus(id: string, status: 'sent' | 'paid' | 'draft') {
    setOpenMenuId(null)
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    }
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
              Delete {selCount} invoice{selCount !== 1 ? 's' : ''}?
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
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Import</h1>
          <p className="text-sm text-gray-500 mt-0.5">Import invoices from CSV or create manually</p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
          style={{ background: 'var(--button-dark)' }}
        >
          <Upload className="w-4 h-4" />
          Import
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          className="bg-white rounded-xl py-16 text-center"
          style={{ border: '1px solid var(--border)' }}
        >
          <p className="text-sm text-gray-500 mb-2">No invoices yet</p>
          <p className="text-xs text-gray-400 mb-4">Import a CSV file or create an invoice manually.</p>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #E5E7EB' }}
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
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
                onClick={() => bulkSetStatus('sent')}
                disabled={working}
                className="font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Mark sent
              </button>
              <button
                onClick={() => bulkSetStatus('paid')}
                disabled={working}
                className="font-medium hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Mark paid
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
            className="hidden lg:grid bg-white px-4 py-2.5 items-center"
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
            <div className={`${COL_HEAD} text-right`}>Total</div>
            <div className={`${COL_HEAD} flex items-center`}>
              <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
              Date
            </div>
            <div className={COL_HEAD} />
          </div>

          {paginated.map(inv => {
            const isSelected = selected.has(inv.id)
            const initials = (inv.customer_name || '?').charAt(0).toUpperCase()
            const cfg = STATUS_DOT[inv.status] || { color: '#9CA3AF', label: inv.status }
            const rowBg = isSelected ? 'rgba(239, 246, 255, 0.4)' : undefined

            return (
              <div key={inv.id}>
                {/* Mobile */}
                <div
                  className="lg:hidden flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                  style={{ borderBottom: '1px solid #F5F5F7', background: rowBg }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(inv.id)}
                    className="w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    style={{ accentColor: '#1C1C1E' }}
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0"
                    style={{ background: '#E5E7EB' }}
                  >
                    {initials}
                  </div>
                  <Link href={`/invoices/${inv.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-normal text-gray-800 truncate">{inv.customer_name}</p>
                      {inv.invoice_number && <span className="text-xs text-gray-400">#{inv.invoice_number}</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {fmtDate(inv.created_at)}{inv.job_address ? ` · ${inv.job_address}` : ''}
                    </p>
                  </Link>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(inv.total)}</p>
                    <span className="text-xs flex items-center gap-1.5 justify-end" style={{ color: cfg.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Desktop */}
                <div
                  style={{
                    gridTemplateColumns: COL_TEMPLATE,
                    background: rowBg,
                    borderBottom: '1px solid #F5F5F7',
                  }}
                  className="hidden lg:grid group px-4 py-3 items-center hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(inv.id)}
                      className="w-3.5 h-3.5 cursor-pointer"
                      style={{ accentColor: '#1C1C1E' }}
                    />
                  </div>
                  <Link href={`/invoices/${inv.id}`} className="min-w-0 pr-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                        style={{ background: '#E5E7EB' }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-normal text-gray-800 truncate">{inv.customer_name}</p>
                          {inv.invoice_number && <span className="text-xs text-gray-400">#{inv.invoice_number}</span>}
                        </div>
                        <span className="text-xs flex items-center gap-1.5" style={{ color: cfg.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="text-sm font-semibold text-gray-900 text-right pr-2">
                    {fmt(inv.total)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{fmtDate(inv.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-end relative" data-menu-root>
                    <button
                      onClick={() => setOpenMenuId(prev => prev === inv.id ? null : inv.id)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all ${openMenuId === inv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuId === inv.id && (
                      <div
                        className="absolute right-0 top-8 z-20 bg-white rounded-lg py-1 min-w-[180px]"
                        style={{ border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-popover)' }}
                      >
                        <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-gray-400">Set status</p>
                        {(['draft', 'sent', 'paid'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(inv.id, s)}
                            disabled={inv.status === s}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s].color }} />
                            <span className="capitalize">{STATUS_DOT[s].label}</span>
                            {inv.status === s && <Check className="w-3.5 h-3.5 ml-auto text-gray-400" />}
                          </button>
                        ))}
                      </div>
                    )}
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
