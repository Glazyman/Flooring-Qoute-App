'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, FileText, X, CheckCircle2 } from 'lucide-react'
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

function parseCsv(text: string): LineItem[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  function findCol(variants: string[]): number {
    for (const v of variants) {
      const idx = rawHeaders.findIndex(h => h === v || h.includes(v))
      if (idx !== -1) return idx
    }
    return -1
  }

  const descCol = findCol(['description', 'desc', 'item', 'name', 'service', 'product'])
  const qtyCol = findCol(['quantity', 'qty', 'count', 'units'])
  const priceCol = findCol(['unit_price', 'unit price', 'price', 'amount', 'rate', 'cost'])

  const items: LineItem[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.every(c => !c)) continue

    const description = descCol >= 0 ? (cols[descCol] ?? '') : (cols[0] ?? '')
    const quantity = qtyCol >= 0 ? parseFloat(cols[qtyCol] ?? '') || 1 : 1
    const unit_price = priceCol >= 0 ? parseFloat((cols[priceCol] ?? '').replace(/[$,]/g, '')) || 0 : 0
    const total = quantity * unit_price

    if (description.trim()) items.push({ description, quantity, unit_price, total })
  }
  return items
}

const inputBase =
  'w-full px-3 py-2 text-sm rounded-md focus:outline-none transition-colors bg-white text-gray-900 placeholder-gray-400'
const inputStyle: React.CSSProperties = { border: '1px solid #E5E7EB' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
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
  const [csvImportCount, setCsvImportCount] = useState<number | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Upload fields
  const [uploadCustomerName, setUploadCustomerName] = useState('')
  const [uploadInvoiceNumber, setUploadInvoiceNumber] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCsv(text)
      if (parsed.length > 0) {
        setLineItems(parsed)
        setCsvImportCount(parsed.length)
        setError('')
      } else {
        setError('Could not parse any line items. Check that your CSV has description, quantity, and price columns.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

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
      <div className="flex bg-gray-100 rounded-md p-1 max-w-md">
        {(['form', 'upload'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } : undefined}
          >
            {t === 'form' ? <FileText className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            {t === 'form' ? 'Fill Out Form' : 'Upload PDF'}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-3.5 py-2.5 rounded-md text-sm" style={{ border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {tab === 'form' ? (
        <div className="space-y-5">
          {/* Customer info */}
          <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold text-gray-900">Customer info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Invoice # (optional)">
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                  className={inputBase}
                  style={inputStyle}
                />
              </Field>
              <Field label="Customer name *">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className={inputBase}
                  style={inputStyle}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={inputBase}
                  style={inputStyle}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className={inputBase}
                  style={inputStyle}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Job address">
                  <input
                    type="text"
                    value={jobAddress}
                    onChange={e => setJobAddress(e.target.value)}
                    placeholder="123 Main St"
                    className={inputBase}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Line items</h2>
              {csvImportCount !== null && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Imported {csvImportCount} line item{csvImportCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* CSV upload zone */}
            <div
              className="border border-dashed rounded-md p-5 text-center hover:bg-gray-50 transition-colors cursor-pointer"
              style={{ borderColor: '#E5E7EB' }}
              onClick={() => csvInputRef.current?.click()}
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (file && file.name.endsWith('.csv')) {
                  const reader = new FileReader()
                  reader.onload = ev => {
                    const text = ev.target?.result as string
                    const parsed = parseCsv(text)
                    if (parsed.length > 0) {
                      setLineItems(parsed)
                      setCsvImportCount(parsed.length)
                      setError('')
                    } else {
                      setError('Could not parse any line items. Check that your CSV has description, quantity, and price columns.')
                    }
                  }
                  reader.readAsText(file)
                } else {
                  setError('Please drop a .csv file.')
                }
              }}
            >
              <input
                type="file"
                accept=".csv"
                className="hidden"
                ref={csvInputRef}
                onChange={handleCsvUpload}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-gray-50 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Upload CSV</p>
                  <p className="text-xs text-gray-400 mt-0.5">Import line items from a spreadsheet — drag &amp; drop or click</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="col-span-5 px-3 py-2 text-sm rounded-md focus:outline-none bg-white"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Qty"
                    min="0"
                    className="col-span-2 px-3 py-2 text-sm rounded-md focus:outline-none bg-white"
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    value={item.unit_price || ''}
                    onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="col-span-3 px-3 py-2 text-sm rounded-md focus:outline-none bg-white"
                    style={inputStyle}
                  />
                  <p className="col-span-1 text-xs font-medium text-gray-700 text-right truncate">{fmt(item.total)}</p>
                  <button
                    onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                    disabled={lineItems.length === 1}
                    className="col-span-1 p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setLineItems(prev => [...prev, emptyItem()])}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add line item
            </button>

            <div className="pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  Tax %
                  <input
                    type="number"
                    value={taxPct || ''}
                    onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-16 px-2 py-1 rounded-md text-sm focus:outline-none bg-white"
                    style={inputStyle}
                  />
                </label>
                <span className="text-sm text-gray-600">{fmt(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm text-gray-900">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)' }}>
            <Field label="Notes (optional)">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Payment terms, thank you message…"
                className={`${inputBase} resize-none min-h-[80px]`}
                style={inputStyle}
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitForm}
              disabled={saving}
              className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-60"
              style={{ background: 'var(--button-dark)' }}
            >
              {saving ? 'Saving…' : 'Save Invoice'}
            </button>
          </div>
        </div>
      ) : (
        /* Upload tab */
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 space-y-4" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold text-gray-900">Invoice details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Customer name *">
                <input
                  type="text"
                  value={uploadCustomerName}
                  onChange={e => setUploadCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className={inputBase}
                  style={inputStyle}
                />
              </Field>
              <Field label="Invoice # (optional)">
                <input
                  type="text"
                  value={uploadInvoiceNumber}
                  onChange={e => setUploadInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                  className={inputBase}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="bg-white rounded-xl p-10 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ border: uploadFile ? '1px solid var(--primary)' : '1px dashed #E5E7EB' }}
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
                <div className="w-10 h-10 rounded-md flex items-center justify-center mx-auto" style={{ background: 'var(--primary-light)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>
                <p className="text-sm font-medium text-gray-800">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(0)} KB · Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-md flex items-center justify-center mx-auto bg-gray-50">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">Click to upload invoice</p>
                <p className="text-xs text-gray-400">PDF, JPG, or PNG</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadFile}
              className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-60"
              style={{ background: 'var(--button-dark)' }}
            >
              {uploading ? 'Uploading…' : 'Save Invoice'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
