'use client'

import { useState, useMemo, useRef } from 'react'
import { Pencil, Trash2, X, Check, Search, UserPlus, Phone, Mail, MapPin, FileText, Upload, AlertCircle, Square, CheckSquare } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

interface FormState {
  name: string
  phone: string
  email: string
  address: string
  notes: string
}

const empty: FormState = { name: '', phone: '', email: '', address: '', notes: '' }

function toForm(c: Customer): FormState {
  return { name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }
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

export default function ContactsClient({ initialCustomers, onSelectContact, mode = 'page' }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Bulk select state
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)))
  }

  function exitSelect() {
    setSelecting(false)
    setSelected(new Set())
  }

  async function bulkDelete() {
    setBulkWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/customers/${id}`, { method: 'DELETE' })
    ))
    setCustomers(prev => prev.filter(c => !selected.has(c.id)))
    exitSelect()
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
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    )
  }, [customers, search])

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
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      setCustomers(prev => prev.filter(c => c.id !== id))
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
    // Reload the page to get fresh list
    window.location.reload()
  }

  const selCount = selected.size
  const allSelected = filtered.length > 0 && selCount === filtered.length

  return (
    <div className="space-y-4">
      {/* Confirm bulk delete */}
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

      {/* Search + Add */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-3.5 py-2.5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="flex-1 text-sm focus:outline-none bg-transparent"
            style={{ color: 'var(--text)' }}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-300 hover:text-gray-500">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {mode === 'page' && customers.length > 0 && (
          <button
            onClick={() => selecting ? exitSelect() : setSelecting(true)}
            className={`flex items-center gap-2 border font-semibold px-3.5 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95 transition-colors ${
              selecting ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {selecting ? 'Cancel' : 'Select'}
          </button>
        )}
        {mode === 'page' && (
          <button
            onClick={() => { setShowImport(v => !v); setImportRows([]); setImportError(''); setImportDone(false) }}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-3.5 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">QuickBooks</span>
          </button>
        )}
        <button
          onClick={startAdd}
          className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95"
          style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Contact</span>
        </button>
      </div>

      {/* Select-all bar */}
      {selecting && filtered.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white" style={{ border: '1px solid var(--border)' }}>
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            {allSelected
              ? <CheckSquare className="w-5 h-5 text-violet-600" />
              : <Square className="w-5 h-5 text-gray-400" />
            }
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selCount > 0 && <span className="text-sm text-gray-400">{selCount} selected</span>}
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
              className="border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-2xl p-8 text-center cursor-pointer transition-colors"
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
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
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
                  style={{ background: 'var(--primary)' }}
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
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>{label}</label>
                <input
                  type={type}
                  value={form[key as keyof FormState]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400"
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
                className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 resize-none"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
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

      {/* Contact List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>
            {search ? 'No contacts match your search' : 'No contacts yet'}
          </p>
          {!search && (
            <button onClick={startAdd} className="text-sm font-semibold mt-1" style={{ color: 'var(--primary)' }}>
              Add your first contact →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(c => {
            const isSelected = selected.has(c.id)
            return (
            <div
              key={c.id}
              className="bg-white rounded-xl p-4 sm:p-5"
              style={{
                border: `1px solid ${isSelected ? '#A78BFA' : 'var(--border)'}`,
                boxShadow: isSelected ? '0 0 0 2px #DDD6FE' : 'var(--shadow-card)',
              }}
            >
              <div className="flex items-start gap-3">
                {selecting && (
                  <button onClick={() => toggleSelect(c.id)} className="flex-shrink-0 mt-0.5 p-0.5">
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-violet-600" />
                      : <Square className="w-5 h-5 text-gray-300" />
                    }
                  </button>
                )}
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: 'var(--primary)' }}
                >
                  {c.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <div className="mt-1.5 space-y-1">
                    {c.phone && (
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {c.phone}
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        {c.email}
                      </p>
                    )}
                    {c.address && (
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-2)' }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {c.address}
                      </p>
                    )}
                    {c.notes && (
                      <p className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                        <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{c.notes}</span>
                      </p>
                    )}
                  </div>
                </div>
                {selecting ? (
                  <button onClick={() => toggleSelect(c.id)} className="p-2 flex-shrink-0">
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-violet-600" />
                      : <Square className="w-5 h-5 text-gray-300" />
                    }
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {mode === 'picker' && onSelectContact && (
                      <button
                        onClick={() => onSelectContact({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' })}
                        className="text-white font-semibold px-3 py-1.5 rounded-xl text-xs active:scale-95"
                        style={{ background: 'var(--primary)' }}
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(c)}
                      className="p-2 rounded-xl hover:bg-gray-50 active:scale-95 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="p-2 rounded-xl hover:bg-red-50 active:scale-95 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Floating bulk action bar */}
      {selecting && selCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl" style={{ background: '#1c1c1e', minWidth: 240 }}>
          <span className="text-white text-sm font-semibold">{selCount} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmBulkDelete(true)}
            disabled={bulkWorking}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
