'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Pencil, Trash2, X, Check, Search, Upload, AlertCircle,
  Plus, SlidersHorizontal, ArrowUpDown, MoreHorizontal,
  Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  company: string | null
  notes: string | null
  created_at: string
}

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  company: string
  notes: string
}

const empty: FormState = { name: '', phone: '', email: '', address: '', company: '', notes: '' }

function toForm(c: Customer): FormState {
  return { name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', company: c.company || '', notes: c.notes || '' }
}

interface Props {
  initialCustomers: Customer[]
  onSelectContact?: (contact: { name: string; phone: string; email: string; address: string }) => void
  mode?: 'page' | 'picker'
}

interface ImportPreviewRow {
  name: string
  phone: string
  email: string
  address: string
}

type FilterMode = 'all' | 'has-email' | 'has-phone'

const PAGE_SIZE = 10

// Parse a QuickBooks-style CSV export into contact rows
function parseQuickBooksCSV(text: string): ImportPreviewRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())

  const col = (row: string[], names: string[]): string => {
    for (const name of names) {
      const idx = headers.indexOf(name)
      if (idx !== -1 && row[idx]) return row[idx].replace(/^"|"$/g, '').trim()
    }
    return ''
  }

  return lines.slice(1).map(line => {
    const row = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) ?? line.split(',')
    const name = col(row, ['customer', 'name', 'full name', 'display name', 'customer:job'])
    const phone = col(row, ['phone', 'phone number', 'main phone', 'mobile', 'work phone'])
    const email = col(row, ['email', 'e-mail', 'email address', 'main email'])
    const address = col(row, ['billing address line 1', 'billing street', 'address', 'street'])
    return { name, phone, email, address }
  }).filter(r => r.name)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COL_TEMPLATE = '32px 1fr 140px 1fr 130px 48px'
const COL_HEAD = 'text-xs text-gray-400 font-normal'

// Completely flat icon buttons — no background, no border. Hover shows faint bg.
const ICON_BTN_BASE =
  'w-8 h-8 flex items-center justify-center rounded-md transition-colors flex-shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-50'
const ICON_BTN_ACTIVE =
  'w-8 h-8 flex items-center justify-center rounded-md transition-colors flex-shrink-0 text-gray-700 bg-gray-100'

export default function ContactsClient({ initialCustomers, onSelectContact, mode = 'page' }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Sort & filter state
  const [sortAZ, setSortAZ] = useState(true)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const filterBtnRef = useRef<HTMLDivElement>(null)

  // Bulk select state — checkboxes are persistent, no separate "select mode".
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

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

  // Close per-row More menu on outside click
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
      fetch(`/api/customers/${id}`, { method: 'DELETE' })
    ))
    setCustomers(prev => prev.filter(c => !selected.has(c.id)))
    setSelected(new Set())
    setConfirmBulkDelete(false)
    setBulkWorking(false)
  }

  // CSV import state
  const [showImport, setShowImport] = useState(false)
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([])
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const csvRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    let list = customers.filter(c => {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
    })
    if (filterMode === 'has-email') list = list.filter(c => c.email)
    if (filterMode === 'has-phone') list = list.filter(c => c.phone)
    return list
  }, [customers, search, filterMode])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) =>
      sortAZ ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    )
  }, [filtered, sortAZ])

  // Reset to page 1 whenever the visible result set shrinks below current page.
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [page, totalPages])
  // Reset to page 1 when the input filters change.
  useEffect(() => { setPage(1) }, [search, filterMode, sortAZ])

  const paginated = useMemo(
    () => mode === 'picker' ? sorted : sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page, mode]
  )

  function startAdd() {
    setEditingId(null)
    setForm(empty)
    setError('')
    setShowForm(true)
  }

  function startEdit(c: Customer) {
    setEditingId(c.id)
    setForm(toForm(c))
    setError('')
    setShowForm(true)
    setOpenMenuId(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(empty)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const res = await fetch(`/api/customers/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed'); return }
        setCustomers(prev => prev.map(c => c.id === editingId ? data.customer : c))
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Failed'); return }
        setCustomers(prev => [...prev, data.customer].sort((a, b) => a.name.localeCompare(b.name)))
      }
      cancelForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setOpenMenuId(null)
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      setCustomers(prev => prev.filter(c => c.id !== id))
      setSelected(prev => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } finally {
      setDeletingId(null)
    }
  }

  function handleCSVFile(file: File) {
    setImportError('')
    setImportDone(false)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const rows = parseQuickBooksCSV(text)
      if (rows.length === 0) {
        setImportError('No valid contacts found. Make sure this is a QuickBooks customer CSV export.')
      } else {
        setImportRows(rows)
      }
    }
    reader.readAsText(file)
  }

  async function handleImportConfirm() {
    setImporting(true)
    setImportError('')
    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: importRows }),
    })
    const data = await res.json()
    setImporting(false)
    if (!res.ok) { setImportError(data.error || 'Import failed'); return }
    setImportDone(true)
    setImportRows([])
    window.location.reload()
  }

  const selCount = selected.size
  const visibleIds = paginated.map(c => c.id)
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

  // Pagination helpers — show up to 5 page buttons centered around current.
  const pageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  return (
    <div className="space-y-4">
      {/* Confirm bulk delete modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>
              Delete {selCount} contact{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBulkDelete(false)} className="flex-1 border font-semibold text-sm py-3 rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                Cancel
              </button>
              <button onClick={bulkDelete} disabled={bulkWorking} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-2xl disabled:opacity-50">
                {bulkWorking ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QuickBooks CSV Import Panel */}
      {showImport && mode === 'page' && (
        <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Import from QuickBooks</h3>
              <p className="text-xs text-gray-400 mt-0.5">Export your customer list from QuickBooks as CSV, then upload it here.</p>
            </div>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {importError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {importError}
            </div>
          )}

          {importDone && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3.5 py-3 rounded-xl text-sm font-medium">
              Contacts imported successfully!
            </div>
          )}

          {importRows.length === 0 ? (
            <div
              onClick={() => csvRef.current?.click()}
              className="border-2 border-dashed border-gray-200 hover:border-teal-300 rounded-2xl p-8 text-center cursor-pointer transition-colors"
            >
              <input
                ref={csvRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVFile(f) }}
              />
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Click to select QuickBooks CSV</p>
              <p className="text-xs text-gray-400 mt-1">In QuickBooks: Customers → Export → Export to CSV</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">{importRows.length} contact{importRows.length !== 1 ? 's' : ''} found — preview:</p>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                {importRows.slice(0, 20).map((r, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0" style={{ background: '#E5E7EB' }}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{[r.email, r.phone].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                ))}
                {importRows.length > 20 && (
                  <p className="text-xs text-gray-400 text-center py-1">+{importRows.length - 20} more</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleImportConfirm}
                  disabled={importing}
                  className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm disabled:opacity-60 active:scale-95"
                  style={{ background: 'var(--button-dark)' }}
                >
                  <Check className="w-4 h-4" />
                  {importing ? 'Importing…' : `Import ${importRows.length} Contacts`}
                </button>
                <button
                  onClick={() => { setImportRows([]); setImportError('') }}
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 active:scale-95 text-gray-500"
                >
                  Choose different file
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              {editingId ? 'Edit Contact' : 'New Contact'}
            </h3>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && <p className="text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Name *', placeholder: 'John Smith', type: 'text' },
              { key: 'phone', label: 'Phone', placeholder: '(555) 000-0000', type: 'tel' },
              { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
              { key: 'address', label: 'Address', placeholder: '123 Main St', type: 'text' },
              { key: 'company', label: 'Company', placeholder: 'Acme Corp', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof FormState]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                rows={2}
                className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 resize-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--button-dark)' }}
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Contact'}
            </button>
            <button onClick={cancelForm} className="px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 active:scale-95" style={{ color: 'var(--text-2)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table Card — wraps toolbar + bulk bar + headers + rows + pagination */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: '1px solid #F1F1F4' }}
      >
        {/* Toolbar — white, flat icons, no background tint */}
        <div
          className="flex flex-wrap items-center gap-1 px-4 py-2.5"
          style={{ borderBottom: '1px solid #F5F5F7' }}
        >
          {/* Left: action icon buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={startAdd}
              className={ICON_BTN_BASE}
              title="Add contact"
              aria-label="Add contact"
            >
              <Plus className="w-4 h-4" />
            </button>

            {mode === 'page' && (
              <>
                {/* Filter button with dropdown */}
                <div className="relative" ref={filterBtnRef}>
                  <button
                    onClick={() => setShowFilterMenu(v => !v)}
                    className={filterMode !== 'all' ? ICON_BTN_ACTIVE : ICON_BTN_BASE}
                    title="Filter contacts"
                    aria-label="Filter"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  {showFilterMenu && (
                    <div
                      className="absolute left-0 top-10 z-20 bg-white rounded-xl shadow-lg py-1 min-w-[160px]"
                      style={{ border: '1px solid #E5E7EB' }}
                    >
                      {(['all', 'has-email', 'has-phone'] as FilterMode[]).map(fm => (
                        <button
                          key={fm}
                          onClick={() => { setFilterMode(fm); setShowFilterMenu(false) }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                          style={{ color: filterMode === fm ? '#111827' : '#374151', fontWeight: filterMode === fm ? 600 : 400 }}
                        >
                          {filterMode === fm && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                          {filterMode !== fm && <span className="w-3.5 h-3.5 flex-shrink-0" />}
                          {fm === 'all' ? 'All contacts' : fm === 'has-email' ? 'Has email' : 'Has phone'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort A↔Z button */}
                <button
                  onClick={() => setSortAZ(v => !v)}
                  className={ICON_BTN_ACTIVE}
                  title={sortAZ ? 'Sorted A→Z (click for Z→A)' : 'Sorted Z→A (click for A→Z)'}
                  aria-label="Sort"
                >
                  <ArrowUpDown
                    className="w-4 h-4"
                    style={{ transform: sortAZ ? 'none' : 'scaleY(-1)' }}
                  />
                </button>

                {/* Import button */}
                <button
                  onClick={() => { setShowImport(v => !v); setImportRows([]); setImportError(''); setImportDone(false) }}
                  className={ICON_BTN_BASE}
                  title="Import from QuickBooks"
                  aria-label="Import"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Right: search — matches reference exactly */}
          <div className="flex items-center gap-2 ml-auto rounded-md px-3 py-1.5 w-full sm:w-56" style={{ border: '1px solid #E5E7EB', background: '#fff' }}>
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent text-sm focus:outline-none flex-1 min-w-0 text-gray-700 placeholder-gray-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="hidden sm:inline text-[10px] text-gray-400 font-mono select-none flex-shrink-0">
                ⌘ /
              </span>
            )}
          </div>
        </div>

        {/* Bulk action bar — only when something is selected */}
        {selCount > 0 && mode === 'page' && (
          <div
            className="flex items-center gap-3 px-4 py-2 text-xs text-gray-600"
            style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F1F4' }}
          >
            <span>{selCount} selected</span>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkWorking}
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

        {/* Empty state */}
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium mb-2 text-gray-500">
              {search || filterMode !== 'all' ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            {!search && filterMode === 'all' && (
              <button
                onClick={startAdd}
                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Column header row — desktop only */}
            <div
              style={{ gridTemplateColumns: COL_TEMPLATE, borderBottom: '1px solid #F5F5F7' }}
              className="hidden sm:grid bg-white px-4 py-2.5 items-center"
            >
              <div className="flex items-center">
                {mode === 'page' && (
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="w-3.5 h-3.5 cursor-pointer"
                    style={{ accentColor: '#1C1C1E' }}
                    aria-label="Select all"
                  />
                )}
              </div>
              <div className={COL_HEAD}>Name</div>
              <div className={COL_HEAD}>Phone</div>
              <div className={COL_HEAD}>Address</div>
              <div className={`${COL_HEAD} flex items-center`}>
                <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                Date Added
              </div>
              <div className={COL_HEAD} />
            </div>

            {/* Data rows */}
            {paginated.map(c => {
              const isSelected = selected.has(c.id)
              const initials = c.name.charAt(0).toUpperCase()

              const nameCell = (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                    style={{ background: '#E5E7EB' }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-normal text-gray-800 truncate">{c.name}</p>
                    {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                  </div>
                </div>
              )

              const rowBg = isSelected ? 'rgba(239, 246, 255, 0.4)' : undefined

              return (
                <div key={c.id}>
                  {/* Mobile card row — hidden on lg+ */}
                  <div
                    className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                    style={{ borderBottom: '1px solid #F5F5F7', background: rowBg }}
                  >
                    {mode === 'page' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                        style={{ accentColor: '#1C1C1E' }}
                        aria-label={`Select ${c.name}`}
                      />
                    )}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0"
                      style={{ background: '#E5E7EB' }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      {mode === 'page' ? (
                        <Link href={`/contacts/${c.id}`} className="block min-w-0">
                          <p className="text-sm font-normal text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {c.address && <p className="text-xs text-gray-400 truncate">{c.address}</p>}
                        </Link>
                      ) : (
                        <>
                          <p className="text-sm font-normal text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {c.address && <p className="text-xs text-gray-400 truncate">{c.address}</p>}
                        </>
                      )}
                    </div>
                    {mode === 'picker' && onSelectContact && (
                      <button
                        onClick={() => onSelectContact({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })}
                        className="text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs active:scale-95 flex-shrink-0"
                        style={{ background: 'var(--button-dark)' }}
                      >
                        Select
                      </button>
                    )}
                  </div>

                  {/* Desktop grid row — hidden on mobile */}
                  <div
                    style={{
                      gridTemplateColumns: COL_TEMPLATE,
                      background: rowBg,
                      borderBottom: '1px solid #F5F5F7',
                    }}
                    className="hidden lg:grid group px-4 py-3 items-center hover:bg-gray-50/60 transition-colors last:border-b-0"
                  >
                    {/* Checkbox */}
                    <div className="flex items-center">
                      {mode === 'page' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="w-3.5 h-3.5 cursor-pointer"
                          style={{ accentColor: '#1C1C1E' }}
                          aria-label={`Select ${c.name}`}
                        />
                      )}
                    </div>

                    {/* Name + email */}
                    <div className="min-w-0 pr-2">
                      {mode === 'page' ? (
                        <Link href={`/contacts/${c.id}`} className="block min-w-0">
                          {nameCell}
                        </Link>
                      ) : (
                        nameCell
                      )}
                    </div>

                    {/* Phone */}
                    <div className="text-sm text-gray-600 truncate pr-2">
                      {c.phone || <span className="text-gray-300">—</span>}
                    </div>

                    {/* Address */}
                    <div className="text-sm text-gray-600 truncate pr-2">
                      {c.address || <span className="text-gray-300">—</span>}
                    </div>

                    {/* Date Added */}
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{formatDate(c.created_at)}</span>
                    </div>

                    {/* Actions: Picker -> Select button; Page -> hover-revealed More menu */}
                    <div className="flex items-center justify-end relative">
                      {mode === 'picker' && onSelectContact && (
                        <button
                          onClick={() => onSelectContact({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })}
                          className="text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs active:scale-95"
                          style={{ background: 'var(--button-dark)' }}
                        >
                          Select
                        </button>
                      )}
                      {mode === 'page' && (
                        <>
                          <button
                            onClick={() => setOpenMenuId(prev => prev === c.id ? null : c.id)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all ${openMenuId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            title="More actions"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === c.id && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg py-1 min-w-[140px]"
                              style={{ border: '1px solid #E5E7EB' }}
                            >
                              <button
                                onClick={() => startEdit(c)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                disabled={deletingId === c.id}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {deletingId === c.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination — hidden in picker mode and when only one page */}
            {mode === 'page' && totalPages > 1 && (
              <div
                className="flex items-center justify-end gap-1 px-4 py-3"
                style={{ borderTop: '1px solid #F1F1F4' }}
              >
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-md text-xs flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
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
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 rounded-md text-xs flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
