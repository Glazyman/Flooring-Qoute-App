'use client'

import { useState } from 'react'
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
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="flex items-center rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white overflow-hidden transition-shadow">
        {prefix && (
          <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 font-medium">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none bg-white"
        />
        {suffix && (
          <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-l border-gray-200 font-medium">
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
  const [form, setForm] = useState({
    company_name: initial.company_name || '',
    phone: initial.phone || '',
    email: initial.email || '',
    logo_url: initial.logo_url || '',
    default_material_cost: String(initial.default_material_cost ?? 5),
    default_labor_cost: String(initial.default_labor_cost ?? 3),
    default_waste_pct: String(initial.default_waste_pct ?? 10),
    default_markup_pct: String(initial.default_markup_pct ?? 0),
    default_deposit_pct: String(initial.default_deposit_pct ?? 50),
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSuccess(false)
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
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Settings saved successfully.
        </div>
      )}

      <Card title="Company Info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Company Name"
              value={form.company_name}
              onChange={(v) => set('company_name', v)}
              placeholder="Smith Flooring LLC"
            />
          </div>
          <Input label="Phone" value={form.phone} onChange={(v) => set('phone', v)} type="tel" placeholder="(555) 000-0000" />
          <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" placeholder="contact@company.com" />
          <div className="sm:col-span-2">
            <Input
              label="Logo URL"
              value={form.logo_url}
              onChange={(v) => set('logo_url', v)}
              placeholder="https://..."
              hint="Public image URL shown on PDF estimates (optional)"
            />
          </div>
        </div>
      </Card>

      <Card title="Default Quote Values" description="These values pre-fill when creating a new quote.">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Material Cost / SqFt" value={form.default_material_cost} onChange={(v) => set('default_material_cost', v)} type="number" prefix="$" placeholder="5.00" />
          <Input label="Labor Cost / SqFt" value={form.default_labor_cost} onChange={(v) => set('default_labor_cost', v)} type="number" prefix="$" placeholder="3.00" />
          <Input label="Waste %" value={form.default_waste_pct} onChange={(v) => set('default_waste_pct', v)} type="number" suffix="%" placeholder="10" />
          <Input label="Markup %" value={form.default_markup_pct} onChange={(v) => set('default_markup_pct', v)} type="number" suffix="%" placeholder="0" />
          <Input label="Deposit %" value={form.default_deposit_pct} onChange={(v) => set('default_deposit_pct', v)} type="number" suffix="%" placeholder="50" />
        </div>
      </Card>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors shadow-sm"
      >
        {saving ? 'Saving…' : 'Save Settings'}
      </button>
    </form>
  )
}
