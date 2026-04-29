'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pencil, Mail, Phone, MapPin, FileText, Building2, X, Check, User } from 'lucide-react'
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

function DetailRow({
  icon,
  label,
  value,
  full,
}: {
  icon: React.ReactNode
  label: string
  value: string
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span>
        {label}
      </p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

export default function ContactDetailClient({
  initialCustomer,
  quotes,
}: {
  initialCustomer: Customer
  quotes: Quote[]
}) {
  const [customer, setCustomer] = useState(initialCustomer)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<FormState>(toForm(initialCustomer))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openEdit() {
    setForm(toForm(customer))
    setError('')
    setShowEdit(true)
  }

  function closeEdit() {
    setShowEdit(false)
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
      setShowEdit(false)
    } finally {
      setSaving(false)
    }
  }

  const hasDetails = !!(customer.phone || customer.email || customer.address || customer.company || customer.notes)

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Edit modal */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) closeEdit() }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-gray-900">Edit Contact</h3>
              <button
                onClick={closeEdit}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Name *', placeholder: 'John Smith', type: 'text' },
                { key: 'phone', label: 'Phone', placeholder: '(555) 000-0000', type: 'tel' },
                { key: 'email', label: 'Email', placeholder: 'john@example.com', type: 'email' },
                { key: 'address', label: 'Address', placeholder: '123 Main St', type: 'text' },
                { key: 'company', label: 'Company', placeholder: 'Acme Corp', type: 'text' },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5 text-gray-500">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key as keyof FormState]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                    style={{ borderColor: '#E5E7EB', color: '#111827' }}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wide mb-1.5 text-gray-500">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes…"
                  rows={3}
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 resize-none"
                  style={{ borderColor: '#E5E7EB', color: '#111827' }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm disabled:opacity-60 active:scale-95"
                style={{ background: '#1d1d1f' }}
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Contact'}
              </button>
              <button
                onClick={closeEdit}
                className="px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 active:scale-95 text-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900 truncate min-w-0">
          {customer.name}
        </h1>
        <button
          onClick={openEdit}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
          style={{ background: 'white', border: '1px solid #E5E7EB' }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      {/* Contact details */}
      <Card title="Contact details">
        {hasDetails ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customer.name && (
                <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Name" value={customer.name} />
              )}
              {customer.phone && (
                <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={formatPhone(customer.phone)} />
              )}
              {customer.email && (
                <DetailRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={customer.email} />
              )}
              {customer.company && (
                <DetailRow icon={<Building2 className="w-3.5 h-3.5" />} label="Company" value={customer.company} />
              )}
              {customer.address && (
                <DetailRow
                  icon={<MapPin className="w-3.5 h-3.5" />}
                  label="Address"
                  value={customer.address}
                  full
                />
              )}
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F1F1F4' }}>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Notes</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">{customer.notes}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">No additional details on file.</p>
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
                      <span
                        className="text-xs flex items-center gap-1.5 flex-shrink-0"
                        style={{ color: cfg.color }}
                      >
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
