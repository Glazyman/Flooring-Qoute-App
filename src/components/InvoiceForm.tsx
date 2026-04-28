'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Upload, FileText, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

const emptyItem = (): LineItem => ({ description: '', quantity: 1, unit_price: 0, total: 0 })

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function InvoiceForm({ defaultTab = 'form' }: { defaultTab?: 'form' | 'upload' }) {
  const router = useRouter()
  const [tab, setTab] = useState<'form' | 'upload'>(defaultTab)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyItem()])
  const [taxPct, setTaxPct] = useState(0)
  const [notes, setNotes] = useState('')

  // Upload fields
  const [uploadCustomerName, setUploadCustomerName] = useState('')
  const [uploadInvoiceNumber, setUploadInvoiceNumber] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => {
      const next = [...prev]
      const item = { ...next[i], [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        item.total = Number(item.quantity) * Number(item.unit_price)
      }
      next[i] = item
      return next
    })
  }

  const subtotal = lineItems.reduce((s, it) => s + it.total, 0)
  const taxAmount = subtotal * (taxPct / 100)
  const total = subtotal + taxAmount

  async function handleSubmitForm() {
    if (!customerName.trim()) { setError('Customer name is required'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_number: invoiceNumber || null,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        job_address: jobAddress || null,
        line_items: lineItems.filter(it => it.description.trim()),
        subtotal,
        tax_pct: taxPct,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
        status: 'draft',
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed to save'); return }
    router.push(`/invoices/${data.invoice.id}`)
  }

  async function handleUpload() {
    if (!uploadCustomerName.trim()) { setError('Customer name is required'); return }
    if (!uploadFile) { setError('Please select a PDF file'); return }

    setUploading(true)
    setError('')

    try {
      const supabase = createClient()
      const ext = uploadFile.name.split('.').pop()
      const path = `invoices/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('invoice-files')
        .upload(path, uploadFile, { contentType: uploadFile.type })

      if (upErr) throw new Error(upErr.message)

      const { data: urlData } = supabase.storage.from('invoice-files').getPublicUrl(path)
      const fileUrl = urlData.publicUrl

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_number: uploadInvoiceNumber || null,
          customer_name: uploadCustomerName,
          file_url: fileUrl,
          status: 'draft',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push(`/invoices/${data.invoice.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {(['form', 'upload'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t === 'form' ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {t === 'form' ? 'Fill Out Form' : 'Upload PDF'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {tab === 'form' ? (
        <div className="space-y-4">
          {/* Customer info */}
          <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Customer Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Invoice # (optional)</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Customer Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Job Address</label>
                <input
                  type="text"
                  value={jobAddress}
                  onChange={e => setJobAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Line Items</p>
            {lineItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="col-span-5 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
                <input
                  type="number"
                  value={item.quantity || ''}
                  onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Qty"
                  min="0"
                  className="col-span-2 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
                <input
                  type="number"
                  value={item.unit_price || ''}
                  onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  min="0"
                  step="0.01"
                  className="col-span-3 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
                <p className="col-span-1 text-xs font-semibold text-gray-700 text-right truncate">{fmt(item.total)}</p>
                <button
                  onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                  disabled={lineItems.length === 1}
                  className="col-span-1 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={() => setLineItems(prev => [...prev, emptyItem()])}
              className="flex items-center gap-1.5 text-sm font-medium mt-1 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-gray-500 flex items-center gap-2">
                  Tax %
                  <input
                    type="number"
                    value={taxPct || ''}
                    onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-16 px-2 py-1 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </label>
                <span className="text-sm text-gray-500">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-gray-900">
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment terms, thank you message…"
              className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 resize-none"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>

          <button
            onClick={handleSubmitForm}
            disabled={saving}
            className="w-full text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60 active:scale-[0.99] transition-all"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 12px rgba(13,148,136,0.3)' }}
          >
            {saving ? 'Saving…' : 'Save Invoice'}
          </button>
        </div>
      ) : (
        /* Upload tab */
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Invoice Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Customer Name *</label>
                <input
                  type="text"
                  value={uploadCustomerName}
                  onChange={e => setUploadCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Invoice # (optional)</label>
                <input
                  type="text"
                  value={uploadInvoiceNumber}
                  onChange={e => setUploadInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                  className="w-full px-3.5 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className={`bg-white rounded-xl p-10 text-center cursor-pointer transition-colors ${
              uploadFile ? 'border-teal-300' : 'border-dashed border-gray-200 hover:border-teal-300'
            }`}
            style={{ border: uploadFile ? '2px solid var(--primary)' : undefined, boxShadow: 'var(--shadow-card)' }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) setUploadFile(f)
              }}
            />
            {uploadFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--primary-light)' }}>
                  <FileText className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <p className="font-semibold text-sm text-gray-800">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(0)} KB · Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-gray-50">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-semibold text-sm text-gray-700">Click to upload invoice</p>
                <p className="text-xs text-gray-400">PDF, JPG, or PNG</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !uploadFile}
            className="w-full text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60 active:scale-[0.99] transition-all"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 12px rgba(13,148,136,0.3)' }}
          >
            {uploading ? 'Uploading…' : 'Save Invoice'}
          </button>
        </div>
      )}
    </div>
  )
}
