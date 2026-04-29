'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel, FLOORING_LABEL } from '@/lib/flooringLabels'
import type { Quote, QuoteStatus } from '@/lib/types'
import {
  Search, X, SlidersHorizontal, ArrowDownUp, ArrowUpDown, MoreHorizontal,
  Calendar, ChevronLeft, ChevronRight, Trash2, Check,
} from 'lucide-react'

interface QuotesTableProps {
  quotes: Quote[]
}

const STATUS_OPTIONS: QuoteStatus[] = ['pending', 'accepted', 'lost']

const STATUS_DOT: Record<QuoteStatus, { color: string; label: string }> = {
  draft:       { color: '#9CA3AF', label: 'Draft' },
  measurement: { color: '#0071e3', label: 'Measurement' },
  pending:     { color: '#ff9f0a', label: 'Pending' },
  accepted:    { color: '#30d158', label: 'Accepted' },
  lost:        { color: '#ff453a', label: 'Lost' },
}

type StatusFilter = 'all' | QuoteStatus

const PAGE_SIZE = 10

const COL_TEMPLATE = '32px 1fr 110px 90px 110px 110px 60px'
const COL_HEAD = 'text-xs text-gray-400 font-normal'

const ICON_BTN_BASE =
  'w-8 h-8 flex items-center justify-center rounded-md transition-colors flex-shrink-0 text-gray-500 hover:bg-gray-100'
const ICON_BTN_ACTIVE =
  'w-8 h-8 flex items-center justify-center rounded-md transition-colors flex-shrink-0 bg-gray-200 text-gray-900'

// Flooring type options shown in the filter (exclude legacy 'hardwood')
const FLOORING_FILTER_OPTIONS = Object.entries(FLOORING_LABEL).filter(([k]) => k !== 'hardwood')

// Date preset helpers
const DATE_PRESETS = [
  { label: 'Today',      days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function QuotesTable({ quotes }: QuotesTableProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [localQuotes, setLocalQuotes] = useState(quotes)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [dateDays, setDateDays] = useState<number | null>(null)
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const filterBtnRef = useRef<HTMLDivElement>(null)

  // Sort state
  const [sortNewest, setSortNewest] = useState(true)

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) +
    (typeFilters.size > 0 ? 1 : 0) +
    (dateDays !== null || customDateFrom || customDateTo ? 1 : 0) +
    (minArea || maxArea ? 1 : 0) +
    (minTotal || maxTotal ? 1 : 0)

  function clearAllFilters() {
    setStatusFilter('all')
    setTypeFilters(new Set())
    setDateDays(null)
    setCustomDateFrom(''); setCustomDateTo('')
    setMinArea(''); setMaxArea('')
    setMinTotal(''); setMaxTotal('')
  }

  function toggleTypeFilter(type: string) {
    setTypeFilters(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  // Bulk select state — checkboxes are persistent
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkStatusPicker, setBulkStatusPicker] = useState(false)

  // Per-row More menu (open id) and pagination
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)

  // Close filter menu on outside click
  useEffect(() => {
    if (!showFilterMenu) return
    function handleMouseDown(e: MouseEvent) {
      if (filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showFilterMenu])

  useEffect(() => {
    if (!openMenuId) return
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [openMenuId])

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
    setOpenMenuId(null)
  }

  async function deleteQuote(quoteId: string) {
    setDeleting(quoteId)
    const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' })
    if (res.ok) {
      setLocalQuotes((prev) => prev.filter((q) => q.id !== quoteId))
      setSelected(prev => {
        if (!prev.has(quoteId)) return prev
        const next = new Set(prev)
        next.delete(quoteId)
        return next
      })
    }
    setDeleting(null)
    setConfirmDelete(null)
    setOpenMenuId(null)
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

  async function bulkDelete() {
    setBulkWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    ))
    setLocalQuotes(prev => prev.filter(q => !selected.has(q.id)))
    setSelected(new Set())
    setConfirmBulkDelete(false)
    setBulkWorking(false)
    router.refresh()
  }

  async function bulkSetStatus(status: QuoteStatus) {
    setBulkWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    ))
    setLocalQuotes(prev => prev.map(q => selected.has(q.id) ? { ...q, status } : q))
    setSelected(new Set())
    setBulkStatusPicker(false)
    setBulkWorking(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()
    return localQuotes.filter(quote => {
      // Status
      if (statusFilter !== 'all' && quote.status !== statusFilter) return false
      // Flooring type
      if (typeFilters.size > 0) {
        const types = quote.section_flooring_types
          ? Object.values(quote.section_flooring_types)
          : [quote.flooring_type]
        const match = types.some(t => typeFilters.has(t))
        if (!match) return false
      }
      // Date — custom range takes priority over preset
      if (customDateFrom || customDateTo) {
        const created = new Date(quote.created_at)
        if (customDateFrom && created < new Date(customDateFrom)) return false
        if (customDateTo) {
          const to = new Date(customDateTo)
          to.setHours(23, 59, 59, 999)
          if (created > to) return false
        }
      } else if (dateDays !== null) {
        const created = new Date(quote.created_at).getTime()
        if (dateDays === 0) {
          const today = new Date().toDateString()
          if (new Date(quote.created_at).toDateString() !== today) return false
        } else {
          const cutoff = now - dateDays * 24 * 60 * 60 * 1000
          if (created < cutoff) return false
        }
      }
      // Area
      const area = quote.adjusted_sqft ?? 0
      if (minArea && area < parseFloat(minArea)) return false
      if (maxArea && area > parseFloat(maxArea)) return false
      // Total
      const total = quote.final_total ?? 0
      if (minTotal && total < parseFloat(minTotal)) return false
      if (maxTotal && total > parseFloat(maxTotal)) return false
      // Search text
      if (q) {
        const label = flooringTypeLabel(quote.flooring_type, quote.section_flooring_types).toLowerCase()
        return (
          quote.customer_name.toLowerCase().includes(q) ||
          (quote.job_address || '').toLowerCase().includes(q) ||
          label.includes(q) ||
          (quote.flooring_type || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [localQuotes, search, statusFilter, typeFilters, dateDays, customDateFrom, customDateTo, minArea, maxArea, minTotal, maxTotal])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return sortNewest ? db - da : da - db
    })
  }, [filtered, sortNewest])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])
  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilters, dateDays, customDateFrom, customDateTo, minArea, maxArea, minTotal, maxTotal, sortNewest])

  const paginated = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page]
  )

  const selCount = selected.size
  const visibleIds = paginated.map(q => q.id)
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

  const pageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  if (localQuotes.length === 0) {
    return (
      <div
        className="bg-white rounded-xl py-16 text-center"
        style={{ border: '1px solid var(--border)' }}
      >
        <p className="text-sm text-gray-500 mb-2">No estimates yet</p>
        <p className="text-xs text-gray-400">Create your first project to get started.</p>
      </div>
    )
  }

  return (
    <>
      {/* Confirm single delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Delete quote?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone. The quote will be permanently removed.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-sm font-medium px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteQuote(confirmDelete)}
                disabled={deleting === confirmDelete}
                className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
                style={{ background: 'var(--danger)' }}
              >
                {deleting === confirmDelete ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm bulk delete */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Delete {selCount} estimate{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="text-sm font-medium px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkWorking}
                className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
                style={{ background: 'var(--danger)' }}
              >
                {bulkWorking ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar — lives OUTSIDE overflow-hidden so filter panel can drop down freely */}
      <div
        className="bg-white rounded-t-xl flex flex-wrap items-center gap-2 px-4 py-2.5"
        style={{ border: '1px solid #E5E7EB', borderBottom: '1px solid #F1F1F4', background: '#FAFAFA' }}
      >
          <div className="flex items-center gap-1">
            {/* Filter */}
            <div className="relative" ref={filterBtnRef}>
              <button
                onClick={() => setShowFilterMenu(v => !v)}
                className={activeFilterCount > 0 ? ICON_BTN_ACTIVE : ICON_BTN_BASE}
                title="Filter quotes"
                aria-label="Filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ background: '#1d1d1f' }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {showFilterMenu && (
                <div
                  className="absolute left-0 top-10 z-30 bg-white rounded-xl w-80 flex flex-col"
                  style={{ border: '1px solid #E5E7EB', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '80vh' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid #F1F1F4' }}>
                    <span className="text-xs font-semibold text-gray-700">Filters</span>
                    {activeFilterCount > 0 && (
                      <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Clear all</button>
                    )}
                  </div>

                  <div className="p-3 space-y-4 overflow-y-auto flex-1">
                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(['all', 'pending', 'accepted', 'lost'] as StatusFilter[]).map(fm => (
                          <button
                            key={fm}
                            onClick={() => setStatusFilter(fm)}
                            className="text-xs px-2.5 py-1 rounded-full border transition-colors capitalize"
                            style={{
                              background: statusFilter === fm ? '#1d1d1f' : 'white',
                              color: statusFilter === fm ? 'white' : '#374151',
                              borderColor: statusFilter === fm ? '#1d1d1f' : '#E5E7EB',
                            }}
                          >
                            {fm === 'all' ? 'All' : fm}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flooring type */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Flooring type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {FLOORING_FILTER_OPTIONS.map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => toggleTypeFilter(key)}
                            className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                            style={{
                              background: typeFilters.has(key) ? '#1d1d1f' : 'white',
                              color: typeFilters.has(key) ? 'white' : '#374151',
                              borderColor: typeFilters.has(key) ? '#1d1d1f' : '#E5E7EB',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Date created</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {DATE_PRESETS.map(p => (
                          <button
                            key={p.days}
                            onClick={() => {
                              setDateDays(dateDays === p.days ? null : p.days)
                              setCustomDateFrom(''); setCustomDateTo('')
                            }}
                            className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                            style={{
                              background: dateDays === p.days && !customDateFrom && !customDateTo ? '#1d1d1f' : 'white',
                              color: dateDays === p.days && !customDateFrom && !customDateTo ? 'white' : '#374151',
                              borderColor: dateDays === p.days && !customDateFrom && !customDateTo ? '#1d1d1f' : '#E5E7EB',
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mb-1">Custom range</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={e => { setCustomDateFrom(e.target.value); setDateDays(null) }}
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-md focus:outline-none text-gray-800"
                          style={{ border: '1px solid #E5E7EB' }}
                        />
                        <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={e => { setCustomDateTo(e.target.value); setDateDays(null) }}
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-md focus:outline-none text-gray-800"
                          style={{ border: '1px solid #E5E7EB' }}
                        />
                      </div>
                    </div>

                    {/* Area */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Area (sqft)</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minArea}
                          onChange={e => setMinArea(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm rounded-md focus:outline-none text-gray-800"
                          style={{ border: '1px solid #E5E7EB' }}
                        />
                        <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxArea}
                          onChange={e => setMaxArea(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm rounded-md focus:outline-none text-gray-800"
                          style={{ border: '1px solid #E5E7EB' }}
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Total ($)</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                          <input
                            type="number"
                            placeholder="Min"
                            value={minTotal}
                            onChange={e => setMinTotal(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 text-sm rounded-md focus:outline-none text-gray-800"
                            style={{ border: '1px solid #E5E7EB' }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs flex-shrink-0">–</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={maxTotal}
                            onChange={e => setMaxTotal(e.target.value)}
                            className="w-full pl-6 pr-2.5 py-1.5 text-sm rounded-md focus:outline-none text-gray-800"
                            style={{ border: '1px solid #E5E7EB' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="w-full text-sm font-medium py-2 rounded-md text-white transition-colors"
                      style={{ background: '#1d1d1f' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <button
              onClick={() => setSortNewest(v => !v)}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium transition-colors text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white"
              title={sortNewest ? 'Click to sort oldest first' : 'Click to sort newest first'}
              aria-label="Sort by date"
            >
              {sortNewest
                ? <ArrowDownUp className="w-3.5 h-3.5 flex-shrink-0" />
                : <ArrowUpDown className="w-3.5 h-3.5 flex-shrink-0" />
              }
              <span className="hidden sm:inline">{sortNewest ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 ml-auto bg-white border border-gray-200 rounded-md px-3 py-1.5 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent text-sm focus:outline-none flex-1 min-w-0 text-gray-700 placeholder-gray-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
      </div>

      {/* Table body card */}
      <div
        className="bg-white rounded-b-xl overflow-hidden"
        style={{ border: '1px solid #E5E7EB', borderTop: 'none' }}
      >

        {/* Bulk action bar */}
        {selCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2 text-xs text-gray-600"
            style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F1F4' }}
          >
            <span>{selCount} selected</span>
            <span className="text-gray-300">·</span>
            {bulkStatusPicker ? (
              <>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => bulkSetStatus(s)}
                    disabled={bulkWorking}
                    className="text-xs flex items-center gap-1.5 hover:opacity-80 disabled:opacity-50 capitalize"
                    style={{ color: STATUS_DOT[s].color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s].color }} />
                    {STATUS_DOT[s].label}
                  </button>
                ))}
                <button onClick={() => setBulkStatusPicker(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setBulkStatusPicker(true)}
                  disabled={bulkWorking}
                  className="font-medium hover:text-gray-900 transition-colors"
                >
                  Set status
                </button>
                <button
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkWorking}
                  className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
            <button
              onClick={() => { setSelected(new Set()); setBulkStatusPicker(false) }}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          </div>
        )}

        {/* Empty state for filtered */}
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">No quotes match your search</p>
          </div>
        ) : (
          <div>
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
              <div className={COL_HEAD}>Total</div>
              <div className={`${COL_HEAD} flex items-center`}>
                <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                Date
              </div>
              <div className={COL_HEAD} />
            </div>

            {paginated.map(q => {
              const isSelected = selected.has(q.id)
              const initials = (q.customer_name || '?').charAt(0).toUpperCase()
              const cfg = STATUS_DOT[q.status] || { color: '#9CA3AF', label: q.status }
              const rowBg = isSelected ? 'rgba(239, 246, 255, 0.4)' : undefined
              // Drafts open in the edit form so the user can continue filling them out
              const rowHref = q.status === 'draft' ? `/quotes/${q.id}/edit` : `/quotes/${q.id}`

              const nameCell = (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                    style={{ background: '#E5E7EB' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-normal text-gray-800 truncate">{q.customer_name}</p>
                    <span className="text-xs flex items-center gap-1.5" style={{ color: cfg.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )

              return (
                <div key={q.id}>
                  {/* Mobile row — entire row is tappable */}
                  <div
                    className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid #F5F5F7', background: rowBg }}
                    onClick={() => router.push(rowHref)}
                  >
                    <div onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                        className="w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                        style={{ accentColor: '#1C1C1E' }}
                      />
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0"
                      style={{ background: '#E5E7EB' }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-normal text-gray-800 truncate">{q.customer_name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {flooringTypeLabel(q.flooring_type, q.section_flooring_types)} · {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{fmt(q.final_total)}</p>
                      <span className="text-xs flex items-center gap-1.5 justify-end" style={{ color: cfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Desktop row — entire row is clickable */}
                  <div
                    style={{
                      gridTemplateColumns: COL_TEMPLATE,
                      background: rowBg,
                      borderBottom: '1px solid #F5F5F7',
                    }}
                    className="hidden sm:grid group px-4 py-3 items-center hover:bg-gray-50/60 transition-colors cursor-pointer last:border-b-0"
                    onClick={() => router.push(rowHref)}
                  >
                    <div className="flex items-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(q.id)}
                        className="w-3.5 h-3.5 cursor-pointer"
                        style={{ accentColor: '#1C1C1E' }}
                      />
                    </div>
                    <div className="min-w-0 pr-2">
                      {nameCell}
                    </div>
                    <div className="text-sm text-gray-600 truncate pr-2">
                      {flooringTypeLabel(q.flooring_type, q.section_flooring_types) || <span className="text-gray-300">—</span>}
                    </div>
                    <div className="text-sm text-gray-600 truncate pr-2">
                      {Math.round(q.adjusted_sqft).toLocaleString()} sqft
                    </div>
                    <div className="text-sm font-semibold text-gray-900 pr-2">
                      {fmt(q.final_total)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{formatDate(q.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-end relative" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setOpenMenuId(prev => prev === q.id ? null : q.id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all ${openMenuId === q.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === q.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-8 z-20 bg-white rounded-lg py-1 min-w-[180px]"
                          style={{ border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-popover)' }}
                        >
                          <p className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-gray-400">Set status</p>
                          {STATUS_OPTIONS.map(s => (
                            <button
                              key={s}
                              onClick={() => updateStatus(q.id, s)}
                              disabled={updating === q.id || q.status === s}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s].color }} />
                              <span className="capitalize">{STATUS_DOT[s].label}</span>
                              {q.status === s && <Check className="w-3.5 h-3.5 ml-auto text-gray-400" />}
                            </button>
                          ))}
                          <div className="my-1" style={{ borderTop: '1px solid #F1F1F4' }} />
                          <button
                            onClick={() => { setOpenMenuId(null); setConfirmDelete(q.id) }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
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
                    aria-label={`Page ${p}`}
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
    </>
  )
}
