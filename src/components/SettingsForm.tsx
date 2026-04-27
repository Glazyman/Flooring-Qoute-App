'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CompanySettings } from '@/lib/types'

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  prefix,
  suffix,
  hint,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  hint?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className={`flex items-center rounded-xl border overflow-hidden transition-all ${
        disabled
          ? 'border-gray-100 bg-gray-50'
          : 'border-gray-200 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent'
      }`}>
        {prefix && (
          <span className={`px-3 py-2.5 text-sm border-r font-medium ${disabled ? 'bg-gray-50 text-gray-300 border-gray-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={type === 'number' ? 'decimal' : undefined}
          disabled={disabled}
          className={`flex-1 px-3.5 py-3 text-base placeholder:text-gray-300 focus:outline-none transition-colors ${
            disabled ? 'bg-gray-50 text-gray-400 cursor-default' : 'bg-white text-gray-900'
          }`}
        />
        {suffix && (
          <span className={`px-3 py-2.5 text-sm border-l font-medium ${disabled ? 'bg-gray-50 text-gray-300 border-gray-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export default function SettingsForm({ settings: initial }: { settings: CompanySettings }) {
  const router = useRouter()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState('')
  const [form, setForm] = useState({
    company_name: initial.company_name || '',
    phone: initial.phone || '',
    email: initial.email || '',
    logo_url: initial.logo_url || '',
    website: initial.website || '',
    default_material_cost: String(initial.default_material_cost ?? 5),
    default_labor_cost: String(initial.default_labor_cost ?? 3),
    default_waste_pct: String(initial.default_waste_pct ?? 10),
    default_markup_pct: String(initial.default_markup_pct ?? 0),
    default_deposit_pct: String(initial.default_deposit_pct ?? 50),
  })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSuccess(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    setLogoUploadError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `logo-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setLogoUploadError('Upload failed: ' + uploadError.message)
      setLogoUploading(false)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    set('logo_url', data.publicUrl)
    setLogoUploading(false)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        default_material_cost: parseFloat(form.default_material_cost) || 0,
        default_labor_cost: parseFloat(form.default_labor_cost) || 0,
        default_waste_pct: parseFloat(form.default_waste_pct) || 0,
        default_markup_pct: parseFloat(form.default_markup_pct) || 0,
        default_deposit_pct: parseFloat(form.default_deposit_pct) || 0,
      }),
    })

    if (res.ok) {
      setSuccess(true)
      setEditing(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }

    setSaving(false)
  }

  const ro = !editing // read-only shorthand

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {/* Header row with Edit / Save / Cancel */}
      <div className="flex items-center justify-between">
        <div>
          {success && !editing && (
            <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    company_name: initial.company_name || '',
                    phone: initial.phone || '',
                    email: initial.email || '',
                    logo_url: initial.logo_url || '',
                    website: initial.website || '',
                    default_material_cost: String(initial.default_material_cost ?? 5),
                    default_labor_cost: String(initial.default_labor_cost ?? 3),
                    default_waste_pct: String(initial.default_waste_pct ?? 10),
                    default_markup_pct: String(initial.default_markup_pct ?? 0),
                    default_deposit_pct: String(initial.default_deposit_pct ?? 50),
                  })
                  setEditing(false)
                  setError('')
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setEditing(true); setSuccess(false) }}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <Card title="Company Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Company Name" value={form.company_name} onChange={(v) => set('company_name', v)} placeholder="Smith Flooring LLC" disabled={ro} />
          </div>
          <Input label="Phone" value={form.phone} onChange={(v) => set('phone', v)} type="tel" placeholder="(555) 000-0000" disabled={ro} />
          <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" placeholder="contact@company.com" disabled={ro} />
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Logo</label>
            <div className="flex gap-3 items-start">
              <div
                className={`w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors ${
                  ro ? 'border-gray-100 bg-gray-50 cursor-default' : 'border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-400'
                }`}
                onClick={() => !ro && logoInputRef.current?.click()}
              >
                {logoUploading ? (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={ro} />
                {!ro && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full text-sm font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 py-2 px-3 rounded-xl transition-colors"
                  >
                    {logoUploading ? 'Uploading…' : form.logo_url ? 'Replace logo' : 'Upload logo'}
                  </button>
                )}
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => set('logo_url', e.target.value)}
                  placeholder="or paste image URL…"
                  disabled={ro}
                  className={`w-full px-3 py-2 text-sm rounded-xl border placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    ro ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-default' : 'border-gray-200 text-gray-700'
                  }`}
                />
                {logoUploadError && <p className="text-xs text-red-500">{logoUploadError}</p>}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Input label="Website" value={form.website} onChange={(v) => set('website', v)} placeholder="yourcompany.com" hint="Shown in the sidebar under your company name" disabled={ro} />
          </div>
        </div>
      </Card>

      <Card title="Default Quote Values" description="These values pre-fill when creating a new quote.">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Material Cost / SqFt" value={form.default_material_cost} onChange={(v) => set('default_material_cost', v)} type="number" prefix="$" placeholder="5.00" disabled={ro} />
          <Input label="Labor Cost / SqFt" value={form.default_labor_cost} onChange={(v) => set('default_labor_cost', v)} type="number" prefix="$" placeholder="3.00" disabled={ro} />
          <Input label="Waste %" value={form.default_waste_pct} onChange={(v) => set('default_waste_pct', v)} type="number" suffix="%" placeholder="10" disabled={ro} />
          <Input label="Markup %" value={form.default_markup_pct} onChange={(v) => set('default_markup_pct', v)} type="number" suffix="%" placeholder="0" disabled={ro} />
          <Input label="Deposit %" value={form.default_deposit_pct} onChange={(v) => set('default_deposit_pct', v)} type="number" suffix="%" placeholder="50" disabled={ro} />
        </div>
      </Card>
    </form>
  )
}
