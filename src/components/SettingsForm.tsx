'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CompanySettings, FlooringType } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { formatPhone } from '@/lib/format'

const FLOORING_TYPES: FlooringType[] = [
  'unfinished',
  'prefinished',
  'engineered',
  'prefinished_engineered',
  'unfinished_engineered',
  'vinyl',
  'tile',
  'carpet',
  'laminate',
]

const FLOORING_LABELS: Record<string, string> = {
  unfinished: 'Unfinished Hardwood',
  prefinished: 'Pre-finished',
  engineered: 'Engineered',
  prefinished_engineered: 'Pre-finished Engineered',
  unfinished_engineered: 'Unfinished Engineered',
  vinyl: 'LVT / Vinyl',
  tile: 'Tile',
  carpet: 'Carpet',
  laminate: 'Laminate',
}

interface FormState {
  company_name: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
  logo_url: string
  website: string
  default_material_cost: string
  default_labor_cost: string
  default_waste_pct: string
  default_markup_pct: string
  default_deposit_pct: string
  default_tax_pct: string
  payment_terms: string
  quote_number_prefix: string
  invoice_number_prefix: string
  default_quote_valid_days: string
  terms_validity: string
  terms_scheduling: string
  terms_scope: string
  default_inclusions: string
  default_exclusions: string
  default_qualifications: string
}

const DEFAULT_TERMS_VALIDITY = 'Prices subject to change without notice after 30 days of estimate.'
const DEFAULT_TERMS_SCHEDULING = 'Additional fees may occur if work is not done at one time.'
const DEFAULT_TERMS_SCOPE = 'Any additional work will be priced and billed separately.'

function buildInitialForm(initial: CompanySettings): FormState {
  return {
    company_name: initial.company_name || '',
    address_line1: initial.address_line1 || '',
    address_line2: initial.address_line2 || '',
    city: initial.city || '',
    state: initial.state || '',
    zip: initial.zip || '',
    phone: initial.phone || '',
    email: initial.email || '',
    logo_url: initial.logo_url || '',
    website: initial.website || '',
    default_material_cost: String(initial.default_material_cost ?? 5),
    default_labor_cost: String(initial.default_labor_cost ?? 3),
    default_waste_pct: String(initial.default_waste_pct ?? 10),
    default_markup_pct: String(initial.default_markup_pct ?? 0),
    default_deposit_pct: String(initial.default_deposit_pct ?? 50),
    default_tax_pct: String(initial.default_tax_pct ?? 0),
    payment_terms: initial.payment_terms ?? '',
    quote_number_prefix: initial.quote_number_prefix ?? '',
    invoice_number_prefix: initial.invoice_number_prefix ?? '',
    default_quote_valid_days: String(initial.default_quote_valid_days ?? 30),
    terms_validity: initial.terms_validity ?? DEFAULT_TERMS_VALIDITY,
    terms_scheduling: initial.terms_scheduling ?? DEFAULT_TERMS_SCHEDULING,
    terms_scope: initial.terms_scope ?? DEFAULT_TERMS_SCOPE,
    default_inclusions: initial.default_inclusions ?? '',
    default_exclusions: initial.default_exclusions ?? '',
    default_qualifications: initial.default_qualifications ?? '',
  }
}

function initMaterialPrices(initial: CompanySettings): Record<string, { material: string; labor: string }> {
  const defaults: Record<string, { material: string; labor: string }> = {}
  for (const type of FLOORING_TYPES) {
    const saved = initial.material_prices_by_type?.[type]
    defaults[type] = {
      material: saved ? String(saved.material) : '',
      labor: saved ? String(saved.labor) : '',
    }
  }
  return defaults
}

function Input({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder = '',
  prefix,
  suffix,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  type?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <div className="flex items-center rounded-md overflow-hidden bg-white" style={{ border: '1px solid #E5E7EB' }}>
        {prefix && (
          <span className="px-2.5 py-2 text-sm text-gray-500 bg-gray-50" style={{ borderRight: '1px solid #E5E7EB' }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={type === 'number' ? 'decimal' : undefined}
          className="flex-1 min-w-0 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none bg-white text-gray-900"
        />
        {suffix && (
          <span className="px-2.5 py-2 text-sm text-gray-500 bg-gray-50" style={{ borderLeft: '1px solid #E5E7EB' }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs mt-1 text-gray-400">{hint}</p>}
    </div>
  )
}

type SettingsTab = 'company' | 'account' | 'email'

function Tabs({ tab, setTab }: { tab: SettingsTab; setTab: (t: SettingsTab) => void }) {
  return (
    <div className="flex gap-1 rounded-md p-1 max-w-md bg-gray-100">
      {(['company', 'account', 'email'] as const).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
            tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function AccountTab() {
  const supabase = createClient()
  const [user, setUser] = useState<{ email: string | null; full_name: string }>({ email: null, full_name: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      const u = data.user
      const fullName = (u?.user_metadata as { full_name?: string; name?: string } | null)?.full_name
        ?? (u?.user_metadata as { full_name?: string; name?: string } | null)?.name
        ?? ''
      setUser({ email: u?.email ?? null, full_name: fullName })
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [supabase])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')

    const updates: { email?: string; password?: string; data?: Record<string, string> } = {}
    if (user.full_name?.trim()) updates.data = { full_name: user.full_name.trim() }
    if (user.email) updates.email = user.email

    if (password) {
      if (password.length < 6) { setError('Password must be at least 6 characters'); setSaving(false); return }
      if (password !== confirmPassword) { setError('Passwords do not match'); setSaving(false); return }
      updates.password = password
    }

    const { error } = await supabase.auth.updateUser(updates)
    setSaving(false)
    if (error) { setError(error.message); return }
    setSuccess('Account updated')
    setPassword(''); setConfirmPassword('')
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <form onSubmit={saveProfile} className="space-y-5 max-w-2xl">
      <Card title="Account">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Full name" value={user.full_name} onChange={(v) => setUser(u => ({ ...u, full_name: v }))} placeholder="Your name" />
          <Input label="Email" value={user.email ?? ''} onChange={(v) => setUser(u => ({ ...u, email: v }))} type="email" placeholder="you@email.com" />
        </div>
      </Card>

      <Card title="Change password" description="Leave blank to keep your current password.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="New password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          <Input label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="••••••••" />
        </div>
      </Card>

      {error && (
        <div className="bg-white rounded-md px-4 py-3 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}>{error}</div>
      )}
      {success && (
        <div className="bg-white rounded-md px-4 py-3 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--success)' }}>{success}</div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--button-dark)' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function EmailTab() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [connection, setConnection] = useState<{
    connected: boolean
    provider?: string
    email_address?: string
  }>({ connected: false })
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (searchParams.get('connected') === '1') {
      setSuccess('Gmail account connected.')
    }
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(`Connection failed: ${oauthError.replace(/_/g, ' ')}`)
    }
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/email/connection')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        if (!cancelled) setConnection(data)
      } catch {
        if (!cancelled) setError('Failed to load connection status')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function disconnect() {
    if (!confirm('Disconnect this Gmail account? Future quotes will fall back to the default email sender.')) {
      return
    }
    setDisconnecting(true)
    setError('')
    try {
      const res = await fetch('/api/email/oauth/google/disconnect', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to disconnect')
      } else {
        setConnection({ connected: false })
        setSuccess('Gmail account disconnected.')
      }
    } catch {
      setError('Network error while disconnecting')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card title="Email sending" description="Connect your Gmail account so quote emails are sent from your own address. If no account is connected, quotes are sent from FloorQuote's shared sender.">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : connection.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-md px-4 py-3" style={{ background: 'var(--success-bg)', border: '1px solid var(--border)' }}>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Connected as {connection.email_address}
                </p>
                <p className="text-xs text-gray-500">
                  {connection.provider === 'gmail' ? 'Gmail' : connection.provider}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={disconnect}
              disabled={disconnecting}
              className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
              style={{ background: 'var(--danger)' }}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Connect your Gmail account to send quotes directly from your email. Customers will see
              your address in their inbox, and replies come straight back to you.
            </p>
            <a
              href="/api/email/oauth/google/start"
              className="inline-flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors"
              style={{ background: 'var(--button-dark)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.236-8 5.143-8-5.143V6l8 5.143L20 6z" />
              </svg>
              Connect Gmail
            </a>
          </div>
        )}
      </Card>

      {success && (
        <div className="bg-white rounded-md px-4 py-3 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--success)' }}>{success}</div>
      )}
      {error && (
        <div className="bg-white rounded-md px-4 py-3 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}>{error}</div>
      )}
    </div>
  )
}

export default function SettingsForm({ settings: initial }: { settings: CompanySettings }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab: SettingsTab =
    tabParam === 'account' ? 'account' : tabParam === 'email' ? 'email' : 'company'
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  function switchTab(t: SettingsTab) {
    setTab(t)
    const url = new URL(window.location.href)
    if (t === 'company') url.searchParams.delete('tab')
    else url.searchParams.set('tab', t)
    // Strip transient OAuth flags when changing tabs.
    url.searchParams.delete('connected')
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
  }

  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUploadError, setLogoUploadError] = useState('')
  const initialForm = useMemo(() => buildInitialForm(initial), [initial])
  const [form, setForm] = useState<FormState>(initialForm)
  const initialPrices = useMemo(() => initMaterialPrices(initial), [initial])
  const [materialPrices, setMaterialPrices] = useState<Record<string, { material: string; labor: string }>>(initialPrices)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSuccess(false)
  }

  // Dirty check (deep compare strings)
  const isDirty = useMemo(() => {
    if (JSON.stringify(form) !== JSON.stringify(initialForm)) return true
    if (JSON.stringify(materialPrices) !== JSON.stringify(initialPrices)) return true
    return false
  }, [form, initialForm, materialPrices, initialPrices])

  function resetForm() {
    setForm(initialForm)
    setMaterialPrices(initialPrices)
    setError('')
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
        phone: formatPhone(form.phone) || null,
        default_material_cost: parseFloat(form.default_material_cost) || 0,
        default_labor_cost: parseFloat(form.default_labor_cost) || 0,
        default_waste_pct: parseFloat(form.default_waste_pct) || 0,
        default_markup_pct: parseFloat(form.default_markup_pct) || 0,
        default_deposit_pct: parseFloat(form.default_deposit_pct) || 0,
        default_tax_pct: parseFloat(form.default_tax_pct) || 0,
        default_quote_valid_days: parseInt(form.default_quote_valid_days, 10) || 30,
        payment_terms: form.payment_terms?.trim() || null,
        quote_number_prefix: form.quote_number_prefix?.trim() || null,
        invoice_number_prefix: form.invoice_number_prefix?.trim() || null,
        terms_validity: form.terms_validity?.trim() || null,
        terms_scheduling: form.terms_scheduling?.trim() || null,
        terms_scope: form.terms_scope?.trim() || null,
        material_prices_by_type: Object.fromEntries(
          Object.entries(materialPrices)
            .filter(([, v]) => v.material || v.labor)
            .map(([k, v]) => [k, { material: parseFloat(v.material) || 0, labor: parseFloat(v.labor) || 0 }])
        ),
      }),
    })

    if (res.ok) {
      setSuccess(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save')
    }

    setSaving(false)
  }

  function blurPhone() {
    const f = formatPhone(form.phone)
    if (f !== form.phone) set('phone', f)
  }

  if (tab === 'account') {
    return (
      <div className="space-y-5">
        <Tabs tab={tab} setTab={switchTab} />
        <AccountTab />
      </div>
    )
  }

  if (tab === 'email') {
    return (
      <div className="space-y-5">
        <Tabs tab={tab} setTab={switchTab} />
        <EmailTab />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl pb-24">
      <Tabs tab={tab} setTab={switchTab} />

      {success && !isDirty && (
        <div className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--success)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </div>
      )}

      {error && (
        <div className="bg-white rounded-md px-4 py-3 text-sm" style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <Card title="Company info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input label="Company name" value={form.company_name} onChange={(v) => set('company_name', v)} placeholder="Smith Flooring LLC" />
          </div>
          <Input label="Phone" value={form.phone} onChange={(v) => set('phone', v)} onBlur={blurPhone} type="tel" placeholder="(555) 000-0000" />
          <Input label="Email" value={form.email} onChange={(v) => set('email', v)} type="email" placeholder="contact@company.com" />
          <div className="sm:col-span-2">
            <Input label="Address Line 1" value={form.address_line1} onChange={(v) => set('address_line1', v)} placeholder="123 Main St" />
          </div>
          <div className="sm:col-span-2">
            <Input label="Address Line 2" value={form.address_line2} onChange={(v) => set('address_line2', v)} placeholder="Suite 100 (optional)" />
          </div>
          <div className="sm:col-span-2">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="New York" />
              </div>
              <div style={{ width: '6rem' }}>
                <Input label="State" value={form.state} onChange={(v) => set('state', v)} placeholder="NJ" />
              </div>
              <div style={{ width: '7rem' }}>
                <Input label="ZIP" value={form.zip} onChange={(v) => set('zip', v)} placeholder="07601" />
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Logo</label>
            <div className="flex gap-3 items-start">
              <div
                className="w-16 h-16 rounded-md border border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E5E7EB', background: '#FAFAFA' }}
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full text-sm font-medium py-2 px-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ border: '1px solid #E5E7EB' }}
                >
                  {logoUploading ? 'Uploading…' : form.logo_url ? 'Replace logo' : 'Upload logo'}
                </button>
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => set('logo_url', e.target.value)}
                  placeholder="or paste image URL…"
                  className="w-full px-3 py-2 text-sm rounded-md placeholder-gray-400 focus:outline-none transition-colors text-gray-900 bg-white"
                  style={{ border: '1px solid #E5E7EB' }}
                />
                {logoUploadError && <p className="text-xs" style={{ color: 'var(--danger)' }}>{logoUploadError}</p>}
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Input label="Website" value={form.website} onChange={(v) => set('website', v)} placeholder="yourcompany.com" hint="Shown in the sidebar under your company name" />
          </div>
          <Input label="Quote number prefix" value={form.quote_number_prefix} onChange={(v) => set('quote_number_prefix', v)} placeholder="EST" hint="Used to auto-generate quote numbers (e.g. EST-001)" />
          <Input label="Invoice number prefix" value={form.invoice_number_prefix} onChange={(v) => set('invoice_number_prefix', v)} placeholder="INV" hint="Used to auto-generate invoice numbers (e.g. INV-001)" />
        </div>
      </Card>

      <Card title="Default quote values" description="These values pre-fill when creating a new quote.">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Material cost / sqft" value={form.default_material_cost} onChange={(v) => set('default_material_cost', v)} type="number" prefix="$" placeholder="5.00" />
          <Input label="Labor cost / sqft" value={form.default_labor_cost} onChange={(v) => set('default_labor_cost', v)} type="number" prefix="$" placeholder="3.00" />
          <Input label="Waste %" value={form.default_waste_pct} onChange={(v) => set('default_waste_pct', v)} type="number" suffix="%" placeholder="10" />
          <Input label="Profit %" value={form.default_markup_pct} onChange={(v) => set('default_markup_pct', v)} type="number" suffix="%" placeholder="0" hint="Adds % on top of subtotal" />
          <Input label="Deposit %" value={form.default_deposit_pct} onChange={(v) => set('default_deposit_pct', v)} type="number" suffix="%" placeholder="50" />
          <Input
            label="Default tax rate"
            value={form.default_tax_pct}
            onChange={(v) => set('default_tax_pct', v)}
            type="number"
            suffix="%"
            placeholder="0"
            hint="Auto-enables tax on new quotes when above 0"
          />
          <Input
            label="Default validity (days)"
            value={form.default_quote_valid_days}
            onChange={(v) => set('default_quote_valid_days', v)}
            type="number"
            placeholder="30"
            hint="Used to seed Valid for (days) on new quotes"
          />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment terms</label>
            <textarea
              value={form.payment_terms}
              onChange={(e) => set('payment_terms', e.target.value)}
              rows={3}
              placeholder="e.g. 50% deposit due upon acceptance. Balance due upon completion."
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
            <p className="text-xs mt-1 text-gray-400">Shown on the quote PDF and email beneath totals.</p>
          </div>
        </div>
      </Card>

      <Card title="Quote terms & disclaimers" description="These appear as a bulleted disclaimer block on every quote PDF and the in-app view. Leave any of them blank to omit.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Validity</label>
            <textarea
              value={form.terms_validity}
              onChange={(e) => set('terms_validity', e.target.value)}
              rows={2}
              placeholder={DEFAULT_TERMS_VALIDITY}
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Scheduling</label>
            <textarea
              value={form.terms_scheduling}
              onChange={(e) => set('terms_scheduling', e.target.value)}
              rows={2}
              placeholder={DEFAULT_TERMS_SCHEDULING}
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Scope of work</label>
            <textarea
              value={form.terms_scope}
              onChange={(e) => set('terms_scope', e.target.value)}
              rows={2}
              placeholder={DEFAULT_TERMS_SCOPE}
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
          </div>
        </div>
      </Card>

      <Card title="Default inclusions / exclusions / qualifications" description="These pre-fill the Inclusions, Exclusions, and Qualifications sections on new quotes. Leave blank to start empty on each quote.">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Default Inclusions</label>
            <textarea
              value={form.default_inclusions}
              onChange={(e) => set('default_inclusions', e.target.value)}
              rows={3}
              placeholder="e.g. One year warranty on installation labor, Final clean up of job site…"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Default Exclusions</label>
            <textarea
              value={form.default_exclusions}
              onChange={(e) => set('default_exclusions', e.target.value)}
              rows={3}
              placeholder="e.g. Rip/Haul, Furniture or stairs not included unless outlined above…"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Default Qualifications</label>
            <textarea
              value={form.default_qualifications}
              onChange={(e) => set('default_qualifications', e.target.value)}
              rows={3}
              placeholder="e.g. Price is valid for 60 days from date of proposal…"
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] bg-white text-gray-900 placeholder-gray-400"
              style={{ border: '1px solid #E5E7EB' }}
            />
          </div>
        </div>
      </Card>

      <Card title="Pricing by material" description="Override default material and labor costs per flooring type. Leave blank to use the global default.">
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-400 font-normal mb-2">
          <span>Flooring type</span>
          <span>Mat. $/sqft</span>
          <span>Labor $/sqft</span>
        </div>
        <div className="space-y-2">
          {FLOORING_TYPES.map(type => (
            <div key={type} className="grid grid-cols-3 gap-3 items-center">
              <span className="text-sm text-gray-700">{FLOORING_LABELS[type]}</span>
              <div className="flex items-center rounded-md overflow-hidden bg-white" style={{ border: '1px solid #E5E7EB' }}>
                <span className="px-2.5 py-2 text-sm text-gray-500 bg-gray-50" style={{ borderRight: '1px solid #E5E7EB' }}>$</span>
                <input
                  type="number"
                  value={materialPrices[type]?.material ?? ''}
                  onChange={e => setMaterialPrices(prev => ({ ...prev, [type]: { ...prev[type], material: e.target.value } }))}
                  placeholder={form.default_material_cost || '5.00'}
                  inputMode="decimal"
                  className="flex-1 min-w-0 px-2.5 py-2 text-sm focus:outline-none placeholder-gray-400 bg-white text-gray-900"
                />
              </div>
              <div className="flex items-center rounded-md overflow-hidden bg-white" style={{ border: '1px solid #E5E7EB' }}>
                <span className="px-2.5 py-2 text-sm text-gray-500 bg-gray-50" style={{ borderRight: '1px solid #E5E7EB' }}>$</span>
                <input
                  type="number"
                  value={materialPrices[type]?.labor ?? ''}
                  onChange={e => setMaterialPrices(prev => ({ ...prev, [type]: { ...prev[type], labor: e.target.value } }))}
                  placeholder={form.default_labor_cost || '3.00'}
                  inputMode="decimal"
                  className="flex-1 min-w-0 px-2.5 py-2 text-sm focus:outline-none placeholder-gray-400 bg-white text-gray-900"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Sticky save bar (only when dirty) */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 z-30 bg-white px-4 py-3 lg:px-8 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--border)', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <p className="text-xs text-gray-500 mr-auto hidden sm:block">Unsaved changes</p>
          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-medium px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--button-dark)' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
    </form>
  )
}
