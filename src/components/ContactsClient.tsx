'use client'

import { useState, useMemo } from 'react'
import { Pencil, Trash2, X, Check, Search, UserPlus, Phone, Mail, MapPin, FileText } from 'lucide-react'

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

export default function ContactsClient({ initialCustomers, onSelectContact, mode = 'page' }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  return (
    <div className="space-y-4">
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
        <button
          onClick={startAdd}
          className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95"
          style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Contact</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-3xl p-5 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
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
        <div className="bg-white rounded-3xl p-12 text-center" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
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
          {filtered.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-4 sm:p-5"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start gap-3">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
