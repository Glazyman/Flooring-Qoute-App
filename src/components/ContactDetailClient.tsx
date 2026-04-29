'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Mail, Phone, MapPin, FileText, Building2, User, ArrowLeft, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { fmt } from '@/lib/calculations'
import { formatPhone } from '@/lib/format'
import type { Quote } from '@/lib/types'

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

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  measurement: { color: '#3B82F6', label: 'Measurement' },
  pending: { color: '#6366F1', label: 'Pending' },
  accepted: { color: '#10B981', label: 'Accepted' },
  lost: { color: '#EF4444', label: 'Lost' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function toForm(c: Customer): FormState {
  return {
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    company: c.company || '',
    notes: c.notes || '',
  }
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', borderRadius: 8,
  border: '1px solid #E5E7EB', fontSize: 13, color: '#111827',
  outline: 'none', background: '#fff',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#9CA3AF',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4,
}

export default function ContactDetailClient({
  initialCustomer,
  quotes,
}: {
  initialCustomer: Customer
  quotes: Quote[]
}) {
  const [customer, setCustomer] = useState(initialCustomer)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>(toForm(initialCustomer))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function startEdit() {
    setForm(toForm(customer))
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }
      setCustomer(data.customer)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cardAction = editing ? (
    <div className="flex items-center gap-2">
      {error && <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>}
      <button
        onClick={cancelEdit}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        style={{ padding: '5px 10px' }}
      >
        <X className="w-3 h-3" /> Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors flex-shrink-0 disabled:opacity-60"
        style={{ background: '#1d1d1f', borderRadius: 9999, padding: '5px 14px' }}
      >
        <Check className="w-3 h-3" />
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  ) : (
    <button
      onClick={startEdit}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors flex-shrink-0"
      style={{ background: '#1d1d1f', borderRadius: 9999, padding: '5px 14px' }}
    >
      <Pencil className="w-3 h-3" />
      Edit
    </button>
  )

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Contacts
      </Link>

      {/* Contact details */}
      <Card title="Contact details" action={cardAction}>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Name', icon: <User className="w-3 h-3" />, placeholder: 'John Smith', type: 'text' },
              { key: 'phone', label: 'Phone', icon: <Phone className="w-3 h-3" />, placeholder: '(555) 000-0000', type: 'tel' },
              { key: 'email', label: 'Email', icon: <Mail className="w-3 h-3" />, placeholder: 'john@example.com', type: 'email' },
              { key: 'company', label: 'Company', icon: <Building2 className="w-3 h-3" />, placeholder: 'Acme Corp', type: 'text' },
            ].map(({ key, label, icon, placeholder, type }) => (
              <div key={key}>
                <p style={labelStyle}>{icon}{label}</p>
                <input
                  type={type}
                  value={form[key as keyof FormState]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={fieldStyle}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <p style={labelStyle}><MapPin className="w-3 h-3" />Address</p>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="123 Main St, City, State"
                style={fieldStyle}
              />
            </div>
            <div className="sm:col-span-2">
              <p style={labelStyle}>Notes</p>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes…"
                rows={3}
                style={{ ...fieldStyle, resize: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customer.name && (
              <div>
                <p style={labelStyle}><User className="w-3 h-3" />Name</p>
                <p className="text-sm text-gray-900">{customer.name}</p>
              </div>
            )}
            {customer.phone && (
              <div>
                <p style={labelStyle}><Phone className="w-3 h-3" />Phone</p>
                <p className="text-sm text-gray-900">{formatPhone(customer.phone)}</p>
              </div>
            )}
            {customer.email && (
              <div>
                <p style={labelStyle}><Mail className="w-3 h-3" />Email</p>
                <p className="text-sm text-gray-900">{customer.email}</p>
              </div>
            )}
            {customer.company && (
              <div>
                <p style={labelStyle}><Building2 className="w-3 h-3" />Company</p>
                <p className="text-sm text-gray-900">{customer.company}</p>
              </div>
            )}
            {customer.address && (
              <div className="sm:col-span-2">
                <p style={labelStyle}><MapPin className="w-3 h-3" />Address</p>
                <p className="text-sm text-gray-900">{customer.address}</p>
              </div>
            )}
            {customer.notes && (
              <div className="sm:col-span-2 pt-3" style={{ borderTop: '1px solid #F1F1F4' }}>
                <p style={labelStyle}>Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
              </div>
            )}
            {!customer.phone && !customer.email && !customer.address && !customer.company && !customer.notes && (
              <p className="text-sm text-gray-400 sm:col-span-2">No additional details on file.</p>
            )}
          </div>
        )}
      </Card>

      {/* Quote history */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F1F4' }}
        >
          <h2 className="text-sm font-semibold text-gray-900">Quote history</h2>
          <span className="text-xs text-gray-400">{quotes.length}</span>
        </div>
        {quotes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-md flex items-center justify-center mx-auto mb-3 bg-gray-100">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold mb-1 text-gray-900">No quotes yet</p>
            <p className="text-xs text-gray-500">
              Quotes saved with this contact&apos;s phone, email, or name will appear here.
            </p>
          </div>
        ) : (
          <div>
            {quotes.map((q, idx) => {
              const cfg = STATUS_DOT[q.status] || { color: '#9CA3AF', label: q.status }
              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/60"
                  style={{ borderBottom: idx < quotes.length - 1 ? '1px solid #F5F5F7' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium truncate text-gray-900">{q.customer_name}</p>
                      <span className="text-xs flex items-center gap-1.5 flex-shrink-0" style={{ color: cfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5 text-gray-500">
                      {q.flooring_type} · {q.adjusted_sqft.toFixed(0)} sqft · {fmtDate(q.created_at)}
                      {q.job_address ? ` · ${q.job_address}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0 text-gray-900">{fmt(q.final_total)}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
