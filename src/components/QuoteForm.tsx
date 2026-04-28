'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { calculateQuote, fmt } from '@/lib/calculations'
import type { CompanySettings, FlooringType, MeasurementType } from '@/lib/types'
import { PlusCircle, Trash2, Upload, Loader2, ChevronDown, ChevronRight, Users, X } from 'lucide-react'

interface CustomerContact {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

const FLOORING_TYPES: { value: FlooringType; label: string }[] = [
  { value: 'hardwood', label: 'Hardwood' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'tile', label: 'Tile' },
  { value: 'carpet', label: 'Carpet' },
  { value: 'laminate', label: 'Laminate' },
]

const SECTIONS = ['Upstairs', 'Downstairs', 'Kitchen', 'Foyer', 'Other'] as const
type Section = typeof SECTIONS[number]

interface Room {
  id: string
  name: string
  section: Section
  // feet + inches
  lengthFt: string
  lengthIn: string
  widthFt: string
  widthIn: string
}

function newRoom(section: Section = 'Upstairs'): Room {
  return { id: crypto.randomUUID(), name: '', section, lengthFt: '', lengthIn: '', widthFt: '', widthIn: '' }
}

function n(v: string): number {
  const p = parseFloat(v)
  return isNaN(p) ? 0 : p
}

// Convert ft+in room to decimal feet sqft
function roomSqft(r: Room): number {
  const l = n(r.lengthFt) + n(r.lengthIn) / 12
  const w = n(r.widthFt) + n(r.widthIn) / 12
  return l * w
}

function fmtDim(r: Room): string {
  const lft = n(r.lengthFt), lin = n(r.lengthIn)
  const wft = n(r.widthFt), win = n(r.widthIn)
  if (!lft && !wft) return '—'
  const L = lin > 0 ? `${lft}'${lin}"` : `${lft}'`
  const W = win > 0 ? `${wft}'${win}"` : `${wft}'`
  return `${L} × ${W}`
}

function Input({
  label, value, onChange, type = 'text', placeholder = '', prefix, suffix, required, decimal,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; prefix?: string; suffix?: string; required?: boolean; decimal?: boolean
}) {
  const inputMode = type === 'number' ? (decimal ? 'decimal' : 'numeric') : undefined
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-2)' }}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex items-center rounded-xl border focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-400 overflow-hidden" style={{ background: 'white', borderColor: 'var(--border)' }}>
        {prefix && <span className="px-3.5 py-3.5 text-sm border-r font-semibold" style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: '#f9f9fb' }}>{prefix}</span>}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          inputMode={inputMode}
          className="flex-1 px-3.5 py-3.5 text-[16px] placeholder:text-gray-300 focus:outline-none"
          style={{ background: 'white', color: 'var(--text)' }}
        />
        {suffix && <span className="px-3.5 py-3.5 text-sm border-l font-semibold" style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: '#f9f9fb' }}>{suffix}</span>}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-5 lg:p-6" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-2)' }}>{title}</h2>
      {children}
    </div>
  )
}

function LineItem({ label, value, bold, muted }: { label: string; value: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? 'text-gray-400' : 'text-gray-700'}`}>
      <span className={bold ? 'font-semibold' : ''}>{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'font-medium'}>{fmt(value)}</span>
    </div>
  )
}

const SECTION_COLORS: Record<Section, string> = {
  Upstairs: 'bg-teal-50 text-teal-700 border-teal-200',
  Downstairs: 'bg-purple-50 text-purple-700 border-purple-200',
  Kitchen: 'bg-orange-50 text-orange-700 border-orange-200',
  Foyer: 'bg-green-50 text-green-700 border-green-200',
  Other: 'bg-gray-50 text-gray-600 border-gray-200',
}

export interface QuoteInitialData {
  customer_name: string
  customer_phone?: string | null
  customer_email?: string | null
  job_address?: string | null
  flooring_type: FlooringType
  measurement_type: MeasurementType
  base_sqft: number
  waste_pct: number
  rooms?: Array<{ name: string | null; section: string | null; length: number; width: number; sqft: number }>
  material_cost_per_sqft: number
  labor_cost_per_sqft: number
  removal_fee?: number
  furniture_fee?: number
  stairs_fee?: number
  stair_count?: number | null
  delivery_fee?: number
  quarter_round_fee?: number
  reducers_fee?: number
  finish_type?: string | null
  wood_species?: string | null
  custom_fee_label?: string | null
  custom_fee_amount?: number
  tax_enabled?: boolean
  tax_pct?: number
  markup_pct?: number
  deposit_pct?: number
  notes?: string | null
  valid_days?: number
}

function initialRoomsFromData(data: QuoteInitialData): Room[] {
  if (!data.rooms || data.rooms.length === 0) return [newRoom('Upstairs')]
  return data.rooms.map(r => {
    const lft = Math.floor(r.length)
    const lin = Math.round((r.length - lft) * 12)
    const wft = Math.floor(r.width)
    const win = Math.round((r.width - wft) * 12)
    const section = (SECTIONS.includes(r.section as Section) ? r.section : 'Other') as Section
    return { id: crypto.randomUUID(), name: r.name || '', section, lengthFt: String(lft), lengthIn: String(lin), widthFt: String(wft), widthIn: String(win) }
  })
}

export default function QuoteForm({
  settings,
  initialData,
  quoteId,
}: {
  settings: CompanySettings | null
  initialData?: QuoteInitialData
  quoteId?: string
}) {
  const isEditing = !!quoteId
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerName, setCustomerName] = useState(initialData?.customer_name ?? '')
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone ?? '')
  const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email ?? '')
  const [jobAddress, setJobAddress] = useState(initialData?.job_address ?? '')

  const [flooringType, setFlooringType] = useState<FlooringType>(initialData?.flooring_type ?? 'hardwood')
  const [measurementType, setMeasurementType] = useState<MeasurementType>(initialData?.measurement_type ?? 'rooms')
  const [manualSqft, setManualSqft] = useState(initialData?.measurement_type === 'manual' ? String(initialData.base_sqft) : '')
  const [rooms, setRooms] = useState<Room[]>(initialData ? initialRoomsFromData(initialData) : [newRoom('Upstairs')])
  const [wastePct, setWastePct] = useState(String(initialData?.waste_pct ?? settings?.default_waste_pct ?? 10))

  const [materialCost, setMaterialCost] = useState(String(initialData?.material_cost_per_sqft ?? settings?.default_material_cost ?? 5))
  const [laborCost, setLaborCost] = useState(String(initialData?.labor_cost_per_sqft ?? settings?.default_labor_cost ?? 3))

  const [removalFee, setRemovalFee] = useState(initialData?.removal_fee ? String(initialData.removal_fee) : '')
  const [furnitureFee, setFurnitureFee] = useState(initialData?.furniture_fee ? String(initialData.furniture_fee) : '')
  const [stairsFee, setStairsFee] = useState(initialData?.stairs_fee ? String(initialData.stairs_fee) : '')
  const [stairCount, setStairCount] = useState(initialData?.stair_count ? String(initialData.stair_count) : '')
  const [deliveryFee, setDeliveryFee] = useState(initialData?.delivery_fee ? String(initialData.delivery_fee) : '')
  const [quarterRoundFee, setQuarterRoundFee] = useState(initialData?.quarter_round_fee ? String(initialData.quarter_round_fee) : '')
  const [reducersFee, setReducersFee] = useState(initialData?.reducers_fee ? String(initialData.reducers_fee) : '')
  const [finishType, setFinishType] = useState(initialData?.finish_type ?? '')
  const [woodSpecies, setWoodSpecies] = useState(initialData?.wood_species ?? '')
  const [customFeeLabel, setCustomFeeLabel] = useState(initialData?.custom_fee_label ?? '')
  const [customFeeAmount, setCustomFeeAmount] = useState(initialData?.custom_fee_amount ? String(initialData.custom_fee_amount) : '')

  const [taxEnabled, setTaxEnabled] = useState(initialData?.tax_enabled ?? false)
  const [taxPct, setTaxPct] = useState(initialData?.tax_pct ? String(initialData.tax_pct) : '')
  const [markupPct, setMarkupPct] = useState(String(initialData?.markup_pct ?? settings?.default_markup_pct ?? 0))
  const [depositPct, setDepositPct] = useState(String(initialData?.deposit_pct ?? settings?.default_deposit_pct ?? 50))
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [validDays, setValidDays] = useState(String(initialData?.valid_days ?? 30))

  // Contacts picker
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactSearch, setContactSearch] = useState('')

  const loadContacts = useCallback(async () => {
    if (contacts.length > 0) return
    setContactsLoading(true)
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setContacts(data.customers || [])
    } finally {
      setContactsLoading(false)
    }
  }, [contacts.length])

  function openContactPicker() {
    setShowContactPicker(true)
    setContactSearch('')
    loadContacts()
  }

  function pickContact(c: CustomerContact) {
    setCustomerName(c.name)
    setCustomerPhone(c.phone || '')
    setCustomerEmail(c.email || '')
    setJobAddress(c.address || '')
    setShowContactPicker(false)
  }

  // Blueprint
  const [blueprintLoading, setBlueprintLoading] = useState(false)
  const [blueprintError, setBlueprintError] = useState('')
  const [blueprintNotes, setBlueprintNotes] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<Section>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const roomsSqft = rooms.reduce((sum, r) => sum + roomSqft(r), 0)
  const baseSqft = measurementType === 'manual' ? n(manualSqft) : roomsSqft

  const calcs = calculateQuote({
    base_sqft: baseSqft,
    waste_pct: n(wastePct),
    material_cost_per_sqft: n(materialCost),
    labor_cost_per_sqft: n(laborCost),
    removal_fee: n(removalFee),
    furniture_fee: n(furnitureFee),
    stairs_fee: n(stairsFee),
    delivery_fee: n(deliveryFee),
    quarter_round_fee: n(quarterRoundFee),
    reducers_fee: n(reducersFee),
    custom_fee_amount: n(customFeeAmount),
    tax_enabled: taxEnabled,
    tax_pct: n(taxPct),
    markup_pct: n(markupPct),
    deposit_pct: n(depositPct),
  })

  function addRoom(section: Section) {
    setRooms(r => [...r, newRoom(section)])
  }

  function removeRoom(id: string) {
    setRooms(r => r.filter(room => room.id !== id))
  }

  function updateRoom(id: string, field: keyof Room, value: string) {
    setRooms(r => r.map(room => room.id === id ? { ...room, [field]: value } : room))
  }

  function toggleSection(section: Section) {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  async function handleBlueprintUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setBlueprintLoading(true)
    setBlueprintError('')

    const allExtracted: Room[] = []
    const allNotes: string[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fd = new FormData()
      fd.append('image', file)

      try {
        const res = await fetch('/api/quotes/blueprint', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok) {
          errors.push(`${file.name}: ${data.error || 'Failed'}`)
          continue
        }

        const extracted: Room[] = (data.rooms || []).map((r: {
          name: string; section: string; lengthFt: number; lengthIn: number
          widthFt: number; widthIn: number
        }) => ({
          id: crypto.randomUUID(),
          name: r.name,
          section: (SECTIONS.includes(r.section as Section) ? r.section : 'Other') as Section,
          lengthFt: String(r.lengthFt),
          lengthIn: String(r.lengthIn || 0),
          widthFt: String(r.widthFt),
          widthIn: String(r.widthIn || 0),
        }))
        allExtracted.push(...extracted)
        if (data.notes) allNotes.push(data.notes)
      } catch {
        errors.push(`${file.name}: Failed to analyze`)
      }
    }

    if (errors.length) setBlueprintError(errors.join(' | '))

    if (allExtracted.length > 0) {
      setMeasurementType('rooms')
      // Append to existing rooms (don't wipe manually added ones)
      setRooms(prev => {
        const hasEmpty = prev.length === 1 && !prev[0].lengthFt && !prev[0].widthFt
        return hasEmpty ? allExtracted : [...prev, ...allExtracted]
      })
      if (allNotes.length) setBlueprintNotes(prev => [prev, ...allNotes].filter(Boolean).join('\n'))
    }

    setBlueprintLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const sectionGroups = SECTIONS.map(section => ({
    section,
    rooms: rooms.filter(r => r.section === section),
  })).filter(g => g.rooms.length > 0 || measurementType === 'rooms')

  const activeSections = SECTIONS.filter(s => rooms.some(r => r.section === s))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) { setError('Customer name is required'); return }
    if (baseSqft <= 0) { setError('Please enter square footage'); return }

    setSaving(true)
    setError('')

    const roomsForApi = measurementType === 'rooms'
      ? rooms
          .filter(r => roomSqft(r) > 0)
          .map(r => ({
            name: r.name || null,
            section: r.section,
            length: n(r.lengthFt) + n(r.lengthIn) / 12,
            width: n(r.widthFt) + n(r.widthIn) / 12,
            sqft: roomSqft(r),
          }))
      : []

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      job_address: jobAddress || null,
      flooring_type: flooringType,
      measurement_type: measurementType,
      base_sqft: baseSqft,
      waste_pct: n(wastePct),
      adjusted_sqft: calcs.adjusted_sqft,
      material_cost_per_sqft: n(materialCost),
      labor_cost_per_sqft: n(laborCost),
      removal_fee: n(removalFee),
      furniture_fee: n(furnitureFee),
      stairs_fee: n(stairsFee),
      stair_count: n(stairCount) || null,
      delivery_fee: n(deliveryFee),
      quarter_round_fee: n(quarterRoundFee),
      reducers_fee: n(reducersFee),
      finish_type: finishType || null,
      wood_species: woodSpecies || null,
      custom_fee_label: customFeeLabel || null,
      custom_fee_amount: n(customFeeAmount),
      tax_enabled: taxEnabled,
      tax_pct: n(taxPct),
      markup_pct: n(markupPct),
      deposit_pct: n(depositPct),
      material_total: calcs.material_total,
      labor_total: calcs.labor_total,
      extras_total: calcs.extras_total,
      subtotal: calcs.subtotal,
      tax_amount: calcs.tax_amount,
      markup_amount: calcs.markup_amount,
      final_total: calcs.final_total,
      deposit_amount: calcs.deposit_amount,
      ...(isEditing ? {} : { status: 'measurement' }),
      notes: [notes, blueprintNotes].filter(Boolean).join('\n\n') || null,
      valid_days: n(validDays) || 30,
      rooms: roomsForApi,
    }

    const url = isEditing ? `/api/quotes/${quoteId}` : '/api/quotes'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save quote'); setSaving(false); return }
    router.push(`/quotes/${isEditing ? quoteId : data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Info */}
          <Card title="Customer Info">
            <div className="flex items-center justify-between mb-4 -mt-1">
              <span />
              <button
                type="button"
                onClick={openContactPicker}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl active:scale-95"
                style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}
              >
                <Users className="w-3.5 h-3.5" />
                Load from Contacts
              </button>
            </div>

            {/* Contact Picker Dropdown */}
            {showContactPicker && (
              <div className="mb-4 rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: '#f9f9fb' }}>
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="flex-1 text-sm focus:outline-none bg-transparent"
                    style={{ color: 'var(--text)' }}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowContactPicker(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto bg-white">
                  {contactsLoading ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>Loading…</p>
                  ) : contacts.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>No contacts saved yet</p>
                  ) : (
                    contacts
                      .filter(c => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickContact(c)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 border-b last:border-0 transition-colors"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{c.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {[c.phone, c.email].filter(Boolean).join(' · ')}
                          </p>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Customer Name" value={customerName} onChange={setCustomerName} placeholder="John Smith" required />
              <Input label="Phone" value={customerPhone} onChange={setCustomerPhone} type="tel" placeholder="(555) 000-0000" />
              <Input label="Email" value={customerEmail} onChange={setCustomerEmail} type="email" placeholder="john@example.com" />
              <Input label="Job Address" value={jobAddress} onChange={setJobAddress} placeholder="123 Main St" />
            </div>
          </Card>

          {/* Project Settings */}
          <Card title="Project Settings">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Flooring Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={flooringType}
                  onChange={(e) => setFlooringType(e.target.value as FlooringType)}
                  className="w-full px-3.5 py-3.5 rounded-xl border text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {FLOORING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <Input label="Waste %" value={wastePct} onChange={setWastePct} type="number" suffix="%" placeholder="10" decimal />
            </div>

            {/* Method toggle */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Measurement Method</label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden p-1 bg-gray-50 gap-1">
                {(['rooms', 'manual'] as MeasurementType[]).map(m => (
                  <button key={m} type="button" onClick={() => setMeasurementType(m)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      measurementType === m ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m === 'rooms' ? 'By Rooms' : 'Total SqFt'}
                  </button>
                ))}
              </div>
            </div>

            {measurementType === 'manual' ? (
              <Input label="Total Square Footage" value={manualSqft} onChange={setManualSqft} type="number" suffix="sqft" placeholder="500" decimal />
            ) : (
              <div className="space-y-4">
                {/* Blueprint upload */}
                <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors ${blueprintLoading ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50'}`}>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBlueprintUpload} />
                  {blueprintLoading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                      <p className="text-sm font-medium text-teal-700">Analyzing with AI…</p>
                      <p className="text-xs text-teal-500">~10–20 seconds per image</p>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 w-full py-2">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                        <Upload className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Upload Blueprint or Measurement Sheet</p>
                        <p className="text-xs text-gray-400 mt-0.5">Select multiple images — one per floor is fine</p>
                      </div>
                    </button>
                  )}
                </div>

                {blueprintError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-medium">
                    {blueprintError}
                  </div>
                )}

                {blueprintNotes && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2.5 rounded-xl text-xs">
                    <p className="font-semibold mb-0.5">Notes extracted from image:</p>
                    <p>{blueprintNotes}</p>
                  </div>
                )}

                {/* Rooms grouped by section */}
                <div className="space-y-3">
                  {activeSections.map(section => {
                    const sectionRooms = rooms.filter(r => r.section === section)
                    const collapsed = collapsedSections.has(section)
                    const sectionTotal = sectionRooms.reduce((s, r) => s + roomSqft(r), 0)

                    return (
                      <div key={section} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Section header */}
                        <button
                          type="button"
                          onClick={() => toggleSection(section)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {collapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${SECTION_COLORS[section]}`}>
                              {section}
                            </span>
                            <span className="text-xs text-gray-400">{sectionRooms.length} room{sectionRooms.length !== 1 ? 's' : ''}</span>
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{sectionTotal.toFixed(0)} sqft</span>
                        </button>

                        {!collapsed && (
                          <div className="p-3 space-y-2">
                            {sectionRooms.map((room, idx) => (
                              <div key={room.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={room.name}
                                    onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                    placeholder={`Room ${idx + 1}`}
                                    className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                  />
                                  <select
                                    value={room.section}
                                    onChange={(e) => updateRoom(room.id, 'section', e.target.value)}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 flex-shrink-0"
                                  >
                                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeRoom(room.id)}
                                    disabled={rooms.length === 1}
                                    className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Ft + In inputs — mobile optimized */}
                                <div className="grid grid-cols-2 gap-2">
                                  {(['length', 'width'] as const).map(dim => (
                                    <div key={dim}>
                                      <label className="block text-xs text-gray-400 mb-1 capitalize">{dim}</label>
                                      <div className="flex gap-1">
                                        <div className="flex items-center flex-1 rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                                          <input
                                            type="number"
                                            inputMode="numeric"
                                            value={dim === 'length' ? room.lengthFt : room.widthFt}
                                            onChange={(e) => updateRoom(room.id, dim === 'length' ? 'lengthFt' : 'widthFt', e.target.value)}
                                            placeholder="0"
                                            className="w-full px-2 py-2.5 text-base font-semibold focus:outline-none bg-transparent text-center"
                                          />
                                          <span className="pr-2 text-xs text-gray-400 font-medium">ft</span>
                                        </div>
                                        <div className="flex items-center w-14 rounded-lg border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                                          <input
                                            type="number"
                                            inputMode="numeric"
                                            value={dim === 'length' ? room.lengthIn : room.widthIn}
                                            onChange={(e) => updateRoom(room.id, dim === 'length' ? 'lengthIn' : 'widthIn', e.target.value)}
                                            placeholder="0" min="0" max="11"
                                            className="w-full px-1.5 py-2.5 text-base font-semibold focus:outline-none bg-transparent text-center"
                                          />
                                          <span className="pr-1.5 text-xs text-gray-400 font-medium">in</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Calculated sqft */}
                                {roomSqft(room) > 0 && (
                                  <div className="mt-2 text-right">
                                    <span className="text-xs text-gray-500">{fmtDim(room)} = </span>
                                    <span className="text-xs font-bold text-gray-900">{roomSqft(room).toFixed(1)} sqft</span>
                                  </div>
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addRoom(section)}
                              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold px-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Add room to {section}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Add to new section */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SECTIONS.filter(s => !activeSections.includes(s)).map(section => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => addRoom(section)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:shadow-sm ${SECTION_COLORS[section]}`}
                      >
                        <PlusCircle className="w-3 h-3" />
                        + {section}
                      </button>
                    ))}
                    {activeSections.length > 0 && SECTIONS.filter(s => !activeSections.includes(s)).length > 0 && (
                      <span className="text-xs text-gray-400 self-center">Add section</span>
                    )}
                  </div>

                  {/* Total bar */}
                  {roomsSqft > 0 && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                      <span className="text-sm text-gray-500">Total measured</span>
                      <span className="text-sm font-bold text-gray-900">{roomsSqft.toFixed(1)} sqft</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Pricing */}
          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Material Cost / SqFt" value={materialCost} onChange={setMaterialCost} type="number" prefix="$" placeholder="5.00" decimal />
              <Input label="Labor Cost / SqFt" value={laborCost} onChange={setLaborCost} type="number" prefix="$" placeholder="3.00" decimal />
            </div>
          </Card>

          {/* Extras */}
          <Card title="Extras & Add-ons">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Removal Fee" value={removalFee} onChange={setRemovalFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Furniture Moving" value={furnitureFee} onChange={setFurnitureFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Quarter Round / Moldings" value={quarterRoundFee} onChange={setQuarterRoundFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Reducers / Saddles" value={reducersFee} onChange={setReducersFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Stairs Fee" value={stairsFee} onChange={setStairsFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="# of Stairs" value={stairCount} onChange={setStairCount} type="number" placeholder="0" />
              <Input label="Delivery Fee" value={deliveryFee} onChange={setDeliveryFee} type="number" prefix="$" placeholder="0" decimal />
            </div>

            {/* Hardwood-specific fields */}
            {flooringType === 'hardwood' && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Finish Type</label>
                  <select
                    value={finishType}
                    onChange={(e) => setFinishType(e.target.value)}
                    className="w-full px-3.5 py-3.5 rounded-xl border text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select finish…</option>
                    <option>Waterbase</option>
                    <option>Oil-based Poly</option>
                    <option>High Gloss</option>
                    <option>Semi Gloss</option>
                    <option>Satin</option>
                    <option>Screen Coat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Wood Species</label>
                  <select
                    value={woodSpecies}
                    onChange={(e) => setWoodSpecies(e.target.value)}
                    className="w-full px-3.5 py-3.5 rounded-xl border text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select species…</option>
                    <option>Red Oak</option>
                    <option>White Oak</option>
                    <option>Maple</option>
                    <option>Hickory</option>
                    <option>Pine</option>
                    <option>Cherry</option>
                    <option>Walnut</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <Input label="Custom Fee Label" value={customFeeLabel} onChange={setCustomFeeLabel} placeholder="Other" />
              <Input label="Custom Fee Amount" value={customFeeAmount} onChange={setCustomFeeAmount} type="number" prefix="$" placeholder="0" decimal />
            </div>
          </Card>

          {/* Tax */}
          <Card title="Tax">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setTaxEnabled(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${taxEnabled ? 'bg-teal-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${taxEnabled ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">Apply sales tax</span>
            </div>
            {taxEnabled && <Input label="Tax Rate" value={taxPct} onChange={setTaxPct} type="number" suffix="%" placeholder="8.5" decimal />}
          </Card>

          {/* Markup & Deposit */}
          <Card title="Markup & Deposit">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Markup %" value={markupPct} onChange={setMarkupPct} type="number" suffix="%" placeholder="0" decimal />
              <Input label="Deposit %" value={depositPct} onChange={setDepositPct} type="number" suffix="%" placeholder="50" decimal />
            </div>
          </Card>

          {/* Notes */}
          <Card title="Notes & Validity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} placeholder="Any additional notes for the customer…"
                  className="w-full px-3.5 py-3.5 rounded-xl border border-gray-200 text-[16px] focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none placeholder:text-gray-300 bg-white"
                  style={{ color: 'var(--text)' }}
                />
              </div>
              <Input label="Valid for (days)" value={validDays} onChange={setValidDays} type="number" placeholder="30" />
            </div>
          </Card>
        </div>

        {/* Right — live totals (desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-3xl p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-2)' }}>Live Estimate</h2>

              {/* Section breakdown */}
              {measurementType === 'rooms' && activeSections.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  {activeSections.map(section => {
                    const s = rooms.filter(r => r.section === section)
                    const sqft = s.reduce((sum, r) => sum + roomSqft(r), 0)
                    if (sqft === 0) return null
                    return (
                      <div key={section} className="flex justify-between text-xs">
                        <span className={`font-semibold px-2 py-0.5 rounded-full border ${SECTION_COLORS[section]}`}>{section}</span>
                        <span className="text-gray-600 font-medium self-center">{sqft.toFixed(0)} sqft</span>
                      </div>
                    )
                  })}
                  <div className="border-t border-gray-100 pt-1.5" />
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{calcs.adjusted_sqft.toFixed(0)}</p>
                <p className="text-xs text-gray-400 mt-0.5">adjusted sqft (incl. {n(wastePct)}% waste)</p>
              </div>

              <div className="space-y-2.5">
                <LineItem label="Material" value={calcs.material_total} />
                <LineItem label="Labor" value={calcs.labor_total} />
                {calcs.extras_total > 0 && <LineItem label="Extras" value={calcs.extras_total} />}
                <div className="border-t border-gray-100 pt-2.5">
                  <LineItem label="Subtotal" value={calcs.subtotal} bold />
                </div>
                {taxEnabled && calcs.tax_amount > 0 && <LineItem label={`Tax (${n(taxPct)}%)`} value={calcs.tax_amount} />}
                {calcs.markup_amount > 0 && <LineItem label={`Markup (${n(markupPct)}%)`} value={calcs.markup_amount} />}
              </div>

              <div className="border-t-2 border-gray-900 mt-3 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(calcs.final_total)}</span>
                </div>
              </div>

              <div className="mt-3 bg-teal-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-teal-700 font-medium">Deposit ({n(depositPct)}%)</span>
                  <span className="font-bold text-teal-700">{fmt(calcs.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Balance due</span>
                  <span className="font-medium">{fmt(calcs.remaining_balance)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={saving}
              className="w-full text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}
            >
              {saving ? 'Saving…' : isEditing ? 'Update Quote →' : 'Save Quote →'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile save button */}
      <div className="lg:hidden pb-4">
        <button
          type="submit" disabled={saving}
          className="w-full text-white font-bold py-4 px-4 rounded-2xl text-base transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)', boxShadow: '0 4px 14px rgba(13,148,136,0.4)' }}
        >
          {saving ? 'Saving…' : isEditing ? 'Update Quote →' : 'Save Quote →'}
        </button>
      </div>
    </form>
  )
}
