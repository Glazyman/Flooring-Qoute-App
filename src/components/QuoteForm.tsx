'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { calculateQuote, fmt, type QuoteExtras } from '@/lib/calculations'
import type { CompanySettings, FlooringType, MeasurementType } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { formatPhone, formatExpiration } from '@/lib/format'
import {
  PlusCircle,
  Trash2,
  Upload,
  Loader2,
  Users,
  X,
  Pencil,
  Copy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface CustomerContact {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

const FLOORING_TYPES: { value: FlooringType; label: string; group?: string }[] = [
  { value: 'unfinished',             label: 'Unfinished',              group: 'Hardwood' },
  { value: 'prefinished',            label: 'Pre-Finished',            group: 'Hardwood' },
  { value: 'engineered',             label: 'Engineered',              group: 'Hardwood' },
  { value: 'prefinished_engineered', label: 'Pre-Finished Engineered', group: 'Hardwood' },
  { value: 'unfinished_engineered',  label: 'Unfinished Engineered',   group: 'Hardwood' },
  { value: 'vinyl',    label: 'Vinyl / LVT' },
  { value: 'tile',     label: 'Tile' },
  { value: 'carpet',   label: 'Carpet' },
  { value: 'laminate', label: 'Laminate' },
]

const HARDWOOD_FAMILY: FlooringType[] = [
  'hardwood',
  'unfinished',
  'prefinished',
  'engineered',
  'prefinished_engineered',
  'unfinished_engineered',
]

function isHardwoodFamily(t: FlooringType | undefined | null): boolean {
  return !!t && (HARDWOOD_FAMILY as string[]).includes(t)
}

interface Room {
  id: string
  name: string
  section: string
  // feet + inches
  lengthFt: string
  lengthIn: string
  widthFt: string
  widthIn: string
}

function newRoom(section: string): Room {
  return { id: crypto.randomUUID(), name: '', section, lengthFt: '', lengthIn: '', widthFt: '', widthIn: '' }
}

function n(v: string): number {
  const p = parseFloat(v)
  return isNaN(p) ? 0 : p
}

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
  label, value, onChange, onBlur, type = 'text', placeholder = '', prefix, suffix, required, decimal, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void
  type?: string; placeholder?: string; prefix?: string; suffix?: string; required?: boolean; decimal?: boolean; hint?: string
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
          type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
          placeholder={placeholder} required={required}
          inputMode={inputMode}
          className="flex-1 min-w-0 px-3.5 py-3.5 text-[16px] placeholder:text-gray-300 focus:outline-none"
          style={{ background: 'white', color: 'var(--text)' }}
        />
        {suffix && <span className="px-3.5 py-3.5 text-sm border-l font-semibold" style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: '#f9f9fb' }}>{suffix}</span>}
      </div>
      {hint && <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>{hint}</p>}
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
  section_flooring_types?: Record<string, FlooringType> | null
  section_pricing?: Record<string, { material: number; labor: number }> | null
  extras_json?: Record<string, number> | null
}

function initialRoomsFromData(data: QuoteInitialData, defaultSection: string): Room[] {
  if (!data.rooms || data.rooms.length === 0) return [newRoom(defaultSection)]
  return data.rooms.map(r => {
    const lft = Math.floor(r.length)
    const lin = Math.round((r.length - lft) * 12)
    const wft = Math.floor(r.width)
    const win = Math.round((r.width - wft) * 12)
    return {
      id: crypto.randomUUID(),
      name: r.name || '',
      section: r.section || defaultSection,
      lengthFt: String(lft),
      lengthIn: String(lin),
      widthFt: String(wft),
      widthIn: String(win),
    }
  })
}

function deriveInitialSections(data: QuoteInitialData | undefined): string[] {
  if (!data) return ['Main Floor']
  const set = new Set<string>()
  if (data.section_flooring_types) Object.keys(data.section_flooring_types).forEach(k => set.add(k))
  if (data.section_pricing) Object.keys(data.section_pricing).forEach(k => set.add(k))
  if (data.rooms) data.rooms.forEach(r => { if (r.section) set.add(r.section) })
  if (set.size === 0) return ['Main Floor']
  return Array.from(set)
}

export default function QuoteForm({
  settings,
  initialData,
  quoteId,
  isPro = false,
}: {
  settings: CompanySettings | null
  initialData?: QuoteInitialData
  quoteId?: string
  isPro?: boolean
}) {
  const isEditing = !!quoteId
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [savingMode, setSavingMode] = useState<'measurement' | 'estimate' | null>(null)
  const [error, setError] = useState('')

  // ---- Sections (dynamic, renameable) ----
  const initialSections = useMemo(() => deriveInitialSections(initialData), [initialData])
  const [sections, setSections] = useState<string[]>(initialSections)
  const firstSection = sections[0]

  const [customerName, setCustomerName] = useState(initialData?.customer_name ?? '')
  const [customerPhone, setCustomerPhone] = useState(initialData?.customer_phone ?? '')
  const [customerEmail, setCustomerEmail] = useState(initialData?.customer_email ?? '')
  const [jobAddress, setJobAddress] = useState(initialData?.job_address ?? '')

  const [flooringType, setFlooringType] = useState<FlooringType>(initialData?.flooring_type ?? 'unfinished')

  // Per-section flooring types
  const [sectionFlooring, setSectionFlooring] = useState<Record<string, FlooringType>>(() => {
    const saved = initialData?.section_flooring_types
    if (saved && Object.keys(saved).length > 0) return { ...saved }
    const base = initialData?.flooring_type ?? 'unfinished'
    const out: Record<string, FlooringType> = {}
    initialSections.forEach(s => { out[s] = base })
    return out
  })

  const [measurementType, setMeasurementType] = useState<MeasurementType>(initialData?.measurement_type ?? 'rooms')
  const [manualSqft, setManualSqft] = useState(initialData?.measurement_type === 'manual' ? String(initialData.base_sqft) : '')
  const [rooms, setRooms] = useState<Room[]>(initialData ? initialRoomsFromData(initialData, firstSection) : [newRoom(firstSection)])
  const [wastePct, setWastePct] = useState(String(initialData?.waste_pct ?? settings?.default_waste_pct ?? 10))

  const [sectionPricing, setSectionPricing] = useState<Record<string, { material: string; labor: string }>>(() => {
    const saved = initialData?.section_pricing
    const defaultMat = String(initialData?.material_cost_per_sqft ?? settings?.default_material_cost ?? 5)
    const defaultLab = String(initialData?.labor_cost_per_sqft ?? settings?.default_labor_cost ?? 3)
    const out: Record<string, { material: string; labor: string }> = {}
    initialSections.forEach(s => {
      const sec = saved?.[s]
      if (sec) {
        out[s] = { material: String(sec.material), labor: String(sec.labor) }
      } else {
        // For new quotes, pick up per-type override if present
        const t = initialData?.section_flooring_types?.[s] ?? initialData?.flooring_type ?? 'unfinished'
        const override = !saved ? settings?.material_prices_by_type?.[t] : null
        out[s] = {
          material: override ? String(override.material) : defaultMat,
          labor: override ? String(override.labor) : defaultLab,
        }
      }
    })
    return out
  })

  function setSectionFlooringType(section: string, type: FlooringType) {
    setSectionFlooring(prev => ({ ...prev, [section]: type }))
    if (section === firstSection) setFlooringType(type)
    const override = settings?.material_prices_by_type?.[type]
    if (override) {
      setSectionPricing(prev => ({
        ...prev,
        [section]: { material: String(override.material), labor: String(override.labor) },
      }))
    }
  }

  const [removalFee, setRemovalFee] = useState(initialData?.removal_fee ? String(initialData.removal_fee) : '')
  const [furnitureFee, setFurnitureFee] = useState(initialData?.furniture_fee ? String(initialData.furniture_fee) : '')
  const [stairsFee, setStairsFee] = useState(initialData?.stairs_fee ? String(initialData.stairs_fee) : '')
  const [stairCount, setStairCount] = useState(initialData?.stair_count ? String(initialData.stair_count) : '')
  const [stairPerStep, setStairPerStep] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(initialData?.delivery_fee ? String(initialData.delivery_fee) : '')
  const [quarterRoundFee, setQuarterRoundFee] = useState(initialData?.quarter_round_fee ? String(initialData.quarter_round_fee) : '')
  const [reducersFee, setReducersFee] = useState(initialData?.reducers_fee ? String(initialData.reducers_fee) : '')
  const [finishType, setFinishType] = useState(initialData?.finish_type ?? '')
  const [woodSpecies, setWoodSpecies] = useState(initialData?.wood_species ?? '')
  const [customFeeLabel, setCustomFeeLabel] = useState(initialData?.custom_fee_label ?? '')
  const [customFeeAmount, setCustomFeeAmount] = useState(initialData?.custom_fee_amount ? String(initialData.custom_fee_amount) : '')

  // Optional extras (jsonb-backed)
  const initialExtras = initialData?.extras_json || null
  const [showAllExtras, setShowAllExtras] = useState(() =>
    !!initialExtras && Object.values(initialExtras).some(v => Number(v) > 0)
  )
  const [subfloorPrep, setSubfloorPrep] = useState(initialExtras?.subfloor_prep ? String(initialExtras.subfloor_prep) : '')
  const [underlaymentPerSqft, setUnderlaymentPerSqft] = useState(initialExtras?.underlayment_per_sqft ? String(initialExtras.underlayment_per_sqft) : '')
  const [transitionQty, setTransitionQty] = useState(initialExtras?.transition_qty ? String(initialExtras.transition_qty) : '')
  const [transitionUnit, setTransitionUnit] = useState(initialExtras?.transition_unit ? String(initialExtras.transition_unit) : '')
  const [floorProtection, setFloorProtection] = useState(initialExtras?.floor_protection ? String(initialExtras.floor_protection) : '')
  const [disposalFee, setDisposalFee] = useState(initialExtras?.disposal_fee ? String(initialExtras.disposal_fee) : '')

  // Default tax behavior:
  // - if editing and quote already has tax_enabled => keep
  // - if creating new and settings.default_tax_pct > 0 => default ON
  const [taxEnabled, setTaxEnabled] = useState(() => {
    if (initialData?.tax_enabled !== undefined) return !!initialData.tax_enabled
    return !!(settings?.default_tax_pct && settings.default_tax_pct > 0)
  })
  const [taxPct, setTaxPct] = useState(
    initialData?.tax_pct
      ? String(initialData.tax_pct)
      : settings?.default_tax_pct
        ? String(settings.default_tax_pct)
        : ''
  )
  const [markupPct, setMarkupPct] = useState(String(initialData?.markup_pct ?? settings?.default_markup_pct ?? 0))
  const [depositPct, setDepositPct] = useState(String(initialData?.deposit_pct ?? settings?.default_deposit_pct ?? 50))
  const [notes, setNotes] = useState(initialData?.notes ?? '')
  const [validDays, setValidDays] = useState(String(initialData?.valid_days ?? settings?.default_quote_valid_days ?? 30))

  // Stair per-step auto-compute: when count + per-step set, write to stairs_fee
  function applyStairPerStep(count: string, perStep: string) {
    const c = n(count)
    const p = n(perStep)
    if (c > 0 && p > 0) setStairsFee(String(+(c * p).toFixed(2)))
  }

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
  const fileRef = useRef<HTMLInputElement>(null)

  // Section editing UI state (per-section X/edit confirm)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editingSectionDraft, setEditingSectionDraft] = useState<string>('')
  const [confirmRemoveSection, setConfirmRemoveSection] = useState<string | null>(null)

  const roomsSqft = rooms.reduce((sum, r) => sum + roomSqft(r), 0)
  const baseSqft = measurementType === 'manual' ? n(manualSqft) : roomsSqft

  const sectionSqftMap = useMemo(() => {
    const map: Record<string, number> = {}
    sections.forEach(s => { map[s] = 0 })
    rooms.forEach(r => { map[r.section] = (map[r.section] || 0) + roomSqft(r) })
    return map
  }, [rooms, sections])

  const wasteFactor = 1 + n(wastePct) / 100
  const materialTotalOverride = measurementType === 'rooms'
    ? sections.reduce((sum, sec) => sum + (sectionSqftMap[sec] || 0) * wasteFactor * n(sectionPricing[sec]?.material || '0'), 0)
    : baseSqft * wasteFactor * n(sectionPricing[firstSection]?.material || '0')
  const laborTotalOverride = measurementType === 'rooms'
    ? sections.reduce((sum, sec) => sum + (sectionSqftMap[sec] || 0) * wasteFactor * n(sectionPricing[sec]?.labor || '0'), 0)
    : baseSqft * wasteFactor * n(sectionPricing[firstSection]?.labor || '0')

  const extrasObj: QuoteExtras = {
    subfloor_prep: n(subfloorPrep),
    underlayment_per_sqft: n(underlaymentPerSqft),
    transition_qty: n(transitionQty),
    transition_unit: n(transitionUnit),
    floor_protection: n(floorProtection),
    disposal_fee: n(disposalFee),
  }

  const calcs = calculateQuote({
    base_sqft: baseSqft,
    waste_pct: n(wastePct),
    material_cost_per_sqft: 0,
    labor_cost_per_sqft: 0,
    material_total_override: materialTotalOverride,
    labor_total_override: laborTotalOverride,
    removal_fee: n(removalFee),
    furniture_fee: n(furnitureFee),
    stairs_fee: n(stairsFee),
    delivery_fee: n(deliveryFee),
    quarter_round_fee: n(quarterRoundFee),
    reducers_fee: n(reducersFee),
    custom_fee_amount: n(customFeeAmount),
    extras: extrasObj,
    tax_enabled: taxEnabled,
    tax_pct: n(taxPct),
    markup_pct: n(markupPct),
    deposit_pct: n(depositPct),
  })

  function addRoom(section: string) {
    setRooms(r => [...r, newRoom(section)])
  }

  function duplicateRoom(roomId: string) {
    setRooms(prev => {
      const idx = prev.findIndex(r => r.id === roomId)
      if (idx < 0) return prev
      const orig = prev[idx]
      const baseName = orig.name?.trim()
      let newName = ''
      if (baseName) {
        const m = baseName.match(/^(.*?)(?:\s*\((copy|\d+)\))?$/)
        const stem = (m?.[1] || baseName).trim()
        newName = `${stem} (copy)`
      } else {
        newName = ''
      }
      const copy: Room = { ...orig, id: crypto.randomUUID(), name: newName }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }

  function removeRoom(id: string) {
    setRooms(r => r.filter(room => room.id !== id))
  }

  function updateRoom(id: string, field: keyof Room, value: string) {
    setRooms(r => r.map(room => room.id === id ? { ...room, [field]: value } : room))
  }

  function addSection() {
    let n = 2
    let candidate = `Floor ${n}`
    while (sections.includes(candidate)) { n++; candidate = `Floor ${n}` }
    setSections(prev => [...prev, candidate])
    setSectionFlooring(prev => ({ ...prev, [candidate]: prev[firstSection] || 'unfinished' }))
    setSectionPricing(prev => ({
      ...prev,
      [candidate]: prev[firstSection] || {
        material: String(settings?.default_material_cost ?? 5),
        labor: String(settings?.default_labor_cost ?? 3),
      },
    }))
  }

  function removeSection(name: string) {
    if (sections.length <= 1) return
    const used = rooms.some(r => r.section === name)
    if (used) {
      setConfirmRemoveSection(name)
      return
    }
    setSections(prev => prev.filter(s => s !== name))
    setSectionFlooring(prev => { const next = { ...prev }; delete next[name]; return next })
    setSectionPricing(prev => { const next = { ...prev }; delete next[name]; return next })
  }

  function confirmRemoveSectionNow(name: string) {
    setSections(prev => prev.filter(s => s !== name))
    setSectionFlooring(prev => { const next = { ...prev }; delete next[name]; return next })
    setSectionPricing(prev => { const next = { ...prev }; delete next[name]; return next })
    setRooms(prev => prev.filter(r => r.section !== name))
    setConfirmRemoveSection(null)
  }

  function startEditSection(name: string) {
    setEditingSection(name)
    setEditingSectionDraft(name)
  }
  function commitEditSection() {
    const oldName = editingSection
    const newName = editingSectionDraft.trim()
    setEditingSection(null)
    if (!oldName || !newName || oldName === newName) return
    if (sections.includes(newName)) return
    setSections(prev => prev.map(s => s === oldName ? newName : s))
    setSectionFlooring(prev => {
      const next = { ...prev }
      next[newName] = next[oldName]
      delete next[oldName]
      return next
    })
    setSectionPricing(prev => {
      const next = { ...prev }
      next[newName] = next[oldName]
      delete next[oldName]
      return next
    })
    setRooms(prev => prev.map(r => r.section === oldName ? { ...r, section: newName } : r))
  }

  async function handleBlueprintUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setBlueprintLoading(true)
    setBlueprintError('')

    const allExtracted: Room[] = []
    const allNotes: string[] = []
    const errors: string[] = []
    const seenSections = new Set<string>()

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
        }) => {
          // Map blueprint sections to our dynamic list, fall back to first section.
          const sec = r.section && typeof r.section === 'string' && r.section.trim()
            ? r.section.trim()
            : firstSection
          seenSections.add(sec)
          return {
            id: crypto.randomUUID(),
            name: r.name,
            section: sec,
            lengthFt: String(r.lengthFt),
            lengthIn: String(r.lengthIn || 0),
            widthFt: String(r.widthFt),
            widthIn: String(r.widthIn || 0),
          }
        })
        allExtracted.push(...extracted)
        if (data.notes) allNotes.push(data.notes)
      } catch {
        errors.push(`${file.name}: Failed to analyze`)
      }
    }

    if (errors.length) setBlueprintError(errors.join(' | '))

    if (allExtracted.length > 0) {
      // Make sure any new sections from blueprint exist in our list
      const newSections = Array.from(seenSections).filter(s => !sections.includes(s))
      if (newSections.length) {
        setSections(prev => [...prev, ...newSections])
        setSectionFlooring(prev => {
          const next = { ...prev }
          newSections.forEach(s => { next[s] = next[firstSection] || 'unfinished' })
          return next
        })
        setSectionPricing(prev => {
          const next = { ...prev }
          newSections.forEach(s => {
            next[s] = next[firstSection] || {
              material: String(settings?.default_material_cost ?? 5),
              labor: String(settings?.default_labor_cost ?? 3),
            }
          })
          return next
        })
      }

      setMeasurementType('rooms')
      setRooms(prev => {
        const hasEmpty = prev.length === 1 && !prev[0].lengthFt && !prev[0].widthFt
        return hasEmpty ? allExtracted : [...prev, ...allExtracted]
      })
      if (allNotes.length) setBlueprintNotes(prev => [prev, ...allNotes].filter(Boolean).join('\n'))
    }

    setBlueprintLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const activeSections = sections.filter(s => rooms.some(r => r.section === s))
  const activeFlooringTypes = activeSections.map(s => sectionFlooring[s]).filter(Boolean) as FlooringType[]
  const showFinishFields = activeFlooringTypes.some(t => isHardwoodFamily(t)) || (measurementType === 'manual' && isHardwoodFamily(sectionFlooring[firstSection]))

  // Phone formatting on blur
  function blurPhone() {
    const f = formatPhone(customerPhone)
    if (f !== customerPhone) setCustomerPhone(f)
  }

  async function handleSubmit(e: React.FormEvent, mode: 'measurement' | 'estimate' | 'update') {
    e.preventDefault()
    if (!customerName.trim()) { setError('Customer name is required'); return }
    if (baseSqft <= 0) { setError('Please enter square footage'); return }

    setSaving(true)
    setSavingMode(mode === 'estimate' ? 'estimate' : 'measurement')
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

    const sectionPricingForApi: Record<string, { material: number; labor: number }> = {}
    sections.forEach(sec => {
      const sp = sectionPricing[sec]
      if (sp) sectionPricingForApi[sec] = { material: n(sp.material), labor: n(sp.labor) }
    })

    const extrasJson: Record<string, number> = {}
    Object.entries(extrasObj).forEach(([k, v]) => { if (v && v > 0) extrasJson[k] = v })

    const statusForCreate = mode === 'estimate' ? 'pending' : 'measurement'

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: formatPhone(customerPhone) || null,
      customer_email: customerEmail || null,
      job_address: jobAddress || null,
      flooring_type: flooringType,
      section_flooring_types: sectionFlooring,
      section_pricing: sectionPricingForApi,
      measurement_type: measurementType,
      base_sqft: baseSqft,
      waste_pct: n(wastePct),
      adjusted_sqft: calcs.adjusted_sqft,
      material_cost_per_sqft: n(sectionPricing[firstSection]?.material || '0'),
      labor_cost_per_sqft: n(sectionPricing[firstSection]?.labor || '0'),
      removal_fee: n(removalFee),
      furniture_fee: n(furnitureFee),
      stairs_fee: n(stairsFee),
      stair_count: n(stairCount) || null,
      delivery_fee: n(deliveryFee),
      quarter_round_fee: n(quarterRoundFee),
      reducers_fee: n(reducersFee),
      finish_type: showFinishFields ? (finishType || null) : null,
      wood_species: showFinishFields ? (woodSpecies || null) : null,
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
      ...(isEditing ? {} : { status: statusForCreate }),
      notes: [notes, blueprintNotes].filter(Boolean).join('\n\n') || null,
      valid_days: n(validDays) || 30,
      extras_json: extrasJson,
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
    if (!res.ok) { setError(data.error || 'Failed to save quote'); setSaving(false); setSavingMode(null); return }
    router.push(`/quotes/${isEditing ? quoteId : data.id}`)
    router.refresh()
  }

  // Total label for the mobile sticky bar
  const totalLabel = `${fmt(calcs.final_total)} • Material+Labor`
  const expirationLabel = formatExpiration(n(validDays) || 0)

  return (
    <form onSubmit={(e) => handleSubmit(e, isEditing ? 'update' : 'measurement')} className="space-y-5 pb-24 lg:pb-0">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">{error}</div>
      )}

      {confirmRemoveSection && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" style={{ border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Remove section &ldquo;{confirmRemoveSection}&rdquo;?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This section has rooms. Removing it will also remove its rooms.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmRemoveSection(null)} className="flex-1 border font-semibold text-sm py-3 rounded-2xl" style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>Cancel</button>
              <button type="button" onClick={() => confirmRemoveSectionNow(confirmRemoveSection)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-2xl">Remove</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Info */}
          <Card title="Customer Info">
            <div className="flex items-center justify-end mb-4 -mt-1">
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

            {showContactPicker && (
              <div className="mb-4 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
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
              <Input label="Phone" value={customerPhone} onChange={setCustomerPhone} onBlur={blurPhone} type="tel" placeholder="(555) 000-0000" />
              <Input label="Email" value={customerEmail} onChange={setCustomerEmail} type="email" placeholder="john@example.com" />
              <Input label="Job Address" value={jobAddress} onChange={setJobAddress} placeholder="123 Main St" />
            </div>
          </Card>

          {/* Project Settings */}
          <Card title="Project Settings">
            {/* Method toggle */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-2)' }}>Measurement Method</label>
              <div className="flex rounded-xl border overflow-hidden p-1 gap-1" style={{ borderColor: 'var(--border)', background: '#f9f9fb' }}>
                {(['rooms', 'manual'] as MeasurementType[]).map(m => (
                  <button key={m} type="button" onClick={() => setMeasurementType(m)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      measurementType === m ? 'bg-white text-teal-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={measurementType === m ? { boxShadow: 'var(--shadow-card)' } : undefined}
                  >
                    {m === 'rooms' ? 'By Rooms' : 'Total SqFt'}
                  </button>
                ))}
              </div>
            </div>

            {measurementType === 'manual' ? (
              <div className="space-y-4">
                <Input label="Total Square Footage" value={manualSqft} onChange={setManualSqft} type="number" suffix="sqft" placeholder="500" decimal />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-2)' }}>Flooring Type</label>
                  <select
                    value={sectionFlooring[firstSection] || 'unfinished'}
                    onChange={e => setSectionFlooringType(firstSection, e.target.value as FlooringType)}
                    className="w-full text-sm font-semibold rounded-xl px-3 py-3 border focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  >
                    <optgroup label="Hardwood">
                      {FLOORING_TYPES.filter(t => t.group === 'Hardwood').map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      {FLOORING_TYPES.filter(t => !t.group).map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-2)' }}>Pricing ($/sqft)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500" style={{ borderColor: 'var(--border)' }}>
                      <span className="px-3 py-3 text-sm font-bold border-r" style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: '#f9f9fb' }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={sectionPricing[firstSection]?.material || ''}
                        onChange={e => setSectionPricing(prev => ({ ...prev, [firstSection]: { ...(prev[firstSection] || { material: '', labor: '' }), material: e.target.value } }))}
                        placeholder="5.00"
                        className="flex-1 min-w-0 px-3 py-3 text-sm font-semibold focus:outline-none bg-transparent"
                      />
                      <span className="px-2.5 py-3 text-[10px] font-bold border-l" style={{ color: 'var(--text-3)', borderColor: 'var(--border)', background: '#f9f9fb' }}>MAT</span>
                    </div>
                    <div className="flex items-center rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500" style={{ borderColor: 'var(--border)' }}>
                      <span className="px-3 py-3 text-sm font-bold border-r" style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: '#f9f9fb' }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={sectionPricing[firstSection]?.labor || ''}
                        onChange={e => setSectionPricing(prev => ({ ...prev, [firstSection]: { ...(prev[firstSection] || { material: '', labor: '' }), labor: e.target.value } }))}
                        placeholder="3.00"
                        className="flex-1 min-w-0 px-3 py-3 text-sm font-semibold focus:outline-none bg-transparent"
                      />
                      <span className="px-2.5 py-3 text-[10px] font-bold border-l" style={{ color: 'var(--text-3)', borderColor: 'var(--border)', background: '#f9f9fb' }}>LAB</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Blueprint upload (Pro tier only) */}
                {isPro ? (
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${blueprintLoading ? 'border-teal-300 bg-teal-50' : 'hover:border-teal-300 hover:bg-teal-50/50'}`} style={{ borderColor: blueprintLoading ? undefined : 'var(--border)' }}>
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
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Upload Blueprint or Measurement Sheet</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Select multiple images — one per floor is fine</p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <a
                    href="/billing/setup"
                    className="block border-2 border-dashed rounded-xl p-4 text-center transition-colors hover:border-teal-300 hover:bg-teal-50/50"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg)' }}>
                        <Upload className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          Upload Blueprint
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>Pro</span>
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>AI extracts every room — upgrade to enable</p>
                      </div>
                    </div>
                  </a>
                )}

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

                {/* Sections (dynamic) */}
                <div className="space-y-4">
                  {sections.map(section => {
                    const sectionRooms = rooms.filter(r => r.section === section)
                    const sectionTotal = sectionRooms.reduce((s, r) => s + roomSqft(r), 0)
                    const secFlooring = sectionFlooring[section] ?? 'unfinished'

                    return (
                      <div key={section} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        {/* Section header */}
                        <div className="px-4 pt-3 pb-2" style={{ background: 'var(--primary-light)' }}>
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {editingSection === section ? (
                                <input
                                  autoFocus
                                  value={editingSectionDraft}
                                  onChange={e => setEditingSectionDraft(e.target.value)}
                                  onBlur={commitEditSection}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') { e.preventDefault(); commitEditSection() }
                                    if (e.key === 'Escape') { setEditingSection(null) }
                                  }}
                                  className="text-xs font-bold uppercase tracking-widest bg-white rounded-lg px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-teal-500 flex-1 min-w-0"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditSection(section)}
                                  className="flex items-center gap-1 group min-w-0"
                                  title="Click to rename"
                                >
                                  <span className="text-xs font-bold uppercase tracking-widest truncate" style={{ color: 'var(--primary)' }}>
                                    {section}
                                  </span>
                                  <Pencil className="w-3 h-3 opacity-30 group-hover:opacity-80 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                                </button>
                              )}
                              <span className="text-xs flex-shrink-0" style={{ color: 'var(--primary)', opacity: 0.7 }}>
                                · {sectionRooms.length} room{sectionRooms.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {sectionTotal > 0 && (
                                <span className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--primary)' }}>
                                  {sectionTotal.toFixed(1)} sqft
                                </span>
                              )}
                              {sections.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSection(section)}
                                  className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                  title="Remove section"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Flooring type selector per section */}
                          <select
                            value={secFlooring}
                            onChange={e => setSectionFlooringType(section, e.target.value as FlooringType)}
                            className="w-full text-sm font-semibold rounded-xl px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                          >
                            <optgroup label="Hardwood">
                              {FLOORING_TYPES.filter(t => t.group === 'Hardwood').map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Other">
                              {FLOORING_TYPES.filter(t => !t.group).map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                              ))}
                            </optgroup>
                          </select>

                          {/* Per-section pricing */}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {(['material', 'labor'] as const).map(kind => (
                              <div key={kind} className="flex items-center rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-400" style={{ borderColor: 'var(--border)' }}>
                                <span className="px-2.5 py-2.5 text-xs font-bold border-r" style={{ color: 'var(--text-2)', borderColor: 'var(--border)', background: '#f9f9fb' }}>$</span>
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  value={sectionPricing[section]?.[kind] || ''}
                                  onChange={e => setSectionPricing(prev => ({
                                    ...prev,
                                    [section]: { ...(prev[section] || { material: '', labor: '' }), [kind]: e.target.value }
                                  }))}
                                  placeholder={kind === 'material' ? '5.00' : '3.00'}
                                  className="flex-1 min-w-0 px-2 py-2.5 text-sm font-semibold focus:outline-none bg-transparent"
                                />
                                <span className="px-2 py-2.5 text-[10px] font-bold border-l whitespace-nowrap" style={{ color: 'var(--text-3)', borderColor: 'var(--border)', background: '#f9f9fb' }}>
                                  {kind === 'material' ? 'MAT' : 'LAB'}<br />
                                  <span className="font-normal">/sqft</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Room cards */}
                        <div className="p-3 space-y-2 bg-white">
                          {sectionRooms.map((room, idx) => (
                            <div key={room.id} className="rounded-xl p-3 space-y-2.5" style={{ background: '#f9fafb', border: '1px solid var(--border)' }}>
                              {/* Name row */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={room.name}
                                  onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                  placeholder={`Room ${idx + 1}`}
                                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                                  style={{ borderColor: 'var(--border)' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => duplicateRoom(room.id)}
                                  className="p-1.5 text-gray-300 hover:text-teal-600 transition-colors rounded flex-shrink-0"
                                  title="Duplicate room"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRoom(room.id)}
                                  disabled={rooms.length === 1}
                                  className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors rounded flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Dimensions */}
                              <div className="grid grid-cols-2 gap-2">
                                {(['length', 'width'] as const).map(dim => (
                                  <div key={dim}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>{dim}</p>
                                    <div className="flex gap-1.5">
                                      <div className="flex items-center flex-1 rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-400" style={{ borderColor: 'var(--border)' }}>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          value={dim === 'length' ? room.lengthFt : room.widthFt}
                                          onChange={(e) => updateRoom(room.id, dim === 'length' ? 'lengthFt' : 'widthFt', e.target.value)}
                                          placeholder="0"
                                          className="w-full px-2.5 py-3 text-lg font-bold focus:outline-none bg-transparent text-center"
                                        />
                                        <span className="pr-2.5 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>ft</span>
                                      </div>
                                      <div className="flex items-center w-16 rounded-xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-400" style={{ borderColor: 'var(--border)' }}>
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          value={dim === 'length' ? room.lengthIn : room.widthIn}
                                          onChange={(e) => updateRoom(room.id, dim === 'length' ? 'lengthIn' : 'widthIn', e.target.value)}
                                          placeholder="0" min="0" max="11"
                                          className="w-full px-1.5 py-3 text-lg font-bold focus:outline-none bg-transparent text-center"
                                        />
                                        <span className="pr-2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>in</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Sqft result */}
                              {roomSqft(room) > 0 && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{fmtDim(room)}</span>
                                  <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{roomSqft(room).toFixed(1)} sqft</span>
                                </div>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addRoom(section)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-teal-50"
                            style={{ color: 'var(--primary)' }}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Add room
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Add Section button */}
                  <button
                    type="button"
                    onClick={addSection}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border border-dashed transition-colors hover:bg-teal-50"
                    style={{ color: 'var(--primary)', borderColor: 'var(--border)' }}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add section
                  </button>

                  {/* Total bar */}
                  {roomsSqft > 0 && (
                    <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--primary-light)', border: '1px solid var(--border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Total measured</span>
                      <span className="text-sm font-extrabold" style={{ color: 'var(--primary)' }}>{roomsSqft.toFixed(1)} sqft</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Extras */}
          <Card title="Extras & Add-ons">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Waste %" value={wastePct} onChange={setWastePct} type="number" suffix="%" placeholder="10" decimal />
              <Input label="Removal Fee" value={removalFee} onChange={setRemovalFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Furniture Moving" value={furnitureFee} onChange={setFurnitureFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Quarter Round / Moldings" value={quarterRoundFee} onChange={setQuarterRoundFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Reducers / Saddles" value={reducersFee} onChange={setReducersFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Delivery Fee" value={deliveryFee} onChange={setDeliveryFee} type="number" prefix="$" placeholder="0" decimal />
            </div>

            {/* Stairs row — count + per-step + computed total */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="# of Stairs"
                  value={stairCount}
                  onChange={(v) => { setStairCount(v); applyStairPerStep(v, stairPerStep) }}
                  type="number"
                  placeholder="0"
                />
                <Input
                  label="Per step ($)"
                  value={stairPerStep}
                  onChange={(v) => { setStairPerStep(v); applyStairPerStep(stairCount, v) }}
                  type="number"
                  prefix="$"
                  placeholder="0"
                  decimal
                />
                <Input
                  label="Stairs Fee"
                  value={stairsFee}
                  onChange={setStairsFee}
                  type="number"
                  prefix="$"
                  placeholder="0"
                  decimal
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
                Charged as a flat total. To bill per step, divide and enter total here — or enter # of stairs and the per-step rate to auto-compute.
              </p>
            </div>

            {/* Hardwood-specific fields */}
            {showFinishFields && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>Finish Type</label>
                  <select
                    value={finishType}
                    onChange={(e) => setFinishType(e.target.value)}
                    className="w-full px-3.5 py-3.5 rounded-xl border text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: 'var(--border)' }}
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
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>Wood Species</label>
                  <select
                    value={woodSpecies}
                    onChange={(e) => setWoodSpecies(e.target.value)}
                    className="w-full px-3.5 py-3.5 rounded-xl border text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ borderColor: 'var(--border)' }}
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

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
              <Input label="Custom Fee Label" value={customFeeLabel} onChange={setCustomFeeLabel} placeholder="Other" />
              <Input label="Custom Fee Amount" value={customFeeAmount} onChange={setCustomFeeAmount} type="number" prefix="$" placeholder="0" decimal />
            </div>

            {/* Show all extras toggle */}
            <button
              type="button"
              onClick={() => setShowAllExtras(v => !v)}
              className="mt-4 flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              {showAllExtras ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {showAllExtras ? 'Hide extras' : 'Show all extras'}
            </button>

            {showAllExtras && (
              <div className="mt-3 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--border)' }}>
                <Input label="Subfloor Prep" value={subfloorPrep} onChange={setSubfloorPrep} type="number" prefix="$" placeholder="0" decimal hint="Flat fee" />
                <Input label="Underlayment" value={underlaymentPerSqft} onChange={setUnderlaymentPerSqft} type="number" prefix="$" placeholder="0" decimal hint="Per adjusted sqft" />
                <Input label="Transition Strips (qty)" value={transitionQty} onChange={setTransitionQty} type="number" placeholder="0" />
                <Input label="Transition $/each" value={transitionUnit} onChange={setTransitionUnit} type="number" prefix="$" placeholder="0" decimal />
                <Input label="Floor Protection" value={floorProtection} onChange={setFloorProtection} type="number" prefix="$" placeholder="0" decimal hint="Flat fee" />
                <Input label="Disposal / Dump Fee" value={disposalFee} onChange={setDisposalFee} type="number" prefix="$" placeholder="0" decimal hint="Flat fee" />
              </div>
            )}
          </Card>

          {/* Tax */}
          <Card title="Tax">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setTaxEnabled(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${taxEnabled ? 'bg-teal-600' : 'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${taxEnabled ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Apply sales tax</span>
            </div>
            {taxEnabled && <Input label="Tax Rate" value={taxPct} onChange={setTaxPct} type="number" suffix="%" placeholder="8.5" decimal />}
          </Card>

          {/* Profit & Deposit */}
          <Card title="Profit & Deposit">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Profit %"
                value={markupPct}
                onChange={setMarkupPct}
                type="number"
                suffix="%"
                placeholder="0"
                decimal
                hint={n(markupPct) > 0 ? `Adds ${n(markupPct)}% on top of subtotal` : undefined}
              />
              <Input label="Deposit %" value={depositPct} onChange={setDepositPct} type="number" suffix="%" placeholder="50" decimal />
            </div>
          </Card>

          {/* Notes */}
          <Card title="Notes & Validity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>Notes</label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} placeholder="Any additional notes for the customer…"
                  className="w-full px-3.5 py-3.5 rounded-xl border text-[16px] focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none placeholder:text-gray-300 bg-white"
                  style={{ color: 'var(--text)', borderColor: 'var(--border)' }}
                />
              </div>
              <Input
                label="Valid for (days)"
                value={validDays}
                onChange={setValidDays}
                type="number"
                placeholder="30"
                hint={expirationLabel ? `Expires ${expirationLabel}` : undefined}
              />
            </div>
          </Card>
        </div>

        {/* Right — live totals (desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-xl p-5" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)' }}>
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
                        <span className="font-semibold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 truncate max-w-[60%]">{section}</span>
                        <span className="text-gray-600 font-medium self-center">{sqft.toFixed(0)} sqft</span>
                      </div>
                    )
                  })}
                  <div className="border-t pt-1.5" style={{ borderColor: 'var(--border)' }} />
                </div>
              )}

              <div className="rounded-xl p-3 mb-4 text-center" style={{ background: '#f9fafb' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{calcs.adjusted_sqft.toFixed(0)}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>adjusted sqft (incl. {n(wastePct)}% waste)</p>
              </div>

              <div className="space-y-2.5">
                <LineItem label="Material" value={calcs.material_total} />
                <LineItem label="Labor" value={calcs.labor_total} />
                {calcs.extras_total > 0 && <LineItem label="Extras" value={calcs.extras_total} />}
                <div className="border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
                  <LineItem label="Subtotal" value={calcs.subtotal} bold />
                </div>
                {taxEnabled && calcs.tax_amount > 0 && <LineItem label={`Tax (${n(taxPct)}%)`} value={calcs.tax_amount} />}
                {calcs.markup_amount > 0 && <LineItem label={`Profit (${n(markupPct)}%)`} value={calcs.markup_amount} />}
              </div>

              <div className="border-t-2 mt-3 pt-3" style={{ borderColor: 'var(--text)' }}>
                <div className="flex justify-between">
                  <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Total</span>
                  <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>{fmt(calcs.final_total)}</span>
                </div>
              </div>

              <div className="mt-3 bg-teal-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-teal-700 font-medium">Deposit ({n(depositPct)}%)</span>
                  <span className="font-bold text-teal-700">{fmt(calcs.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
                  <span>Balance due</span>
                  <span className="font-medium">{fmt(calcs.remaining_balance)}</span>
                </div>
              </div>
            </div>

            {/* Save buttons (desktop) */}
            {isEditing ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'update')}
                disabled={saving}
                className="w-full text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--primary)' }}
              >
                {saving ? 'Saving…' : 'Update Quote →'}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'measurement')}
                  disabled={saving}
                  className="w-full text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'var(--primary)' }}
                >
                  {saving && savingMode === 'measurement' ? 'Saving…' : 'Save as Measurement'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'estimate')}
                  disabled={saving}
                  className="w-full font-semibold py-3.5 px-4 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)' }}
                >
                  {saving && savingMode === 'estimate' ? 'Saving…' : 'Save as Estimate'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar with live total + save buttons */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Total</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{totalLabel}</span>
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'update')}
            disabled={saving}
            className="w-full text-white font-bold py-3.5 rounded-2xl text-base transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {saving ? 'Saving…' : 'Update Quote'}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'measurement')}
              disabled={saving}
              className="text-white font-bold py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {saving && savingMode === 'measurement' ? '…' : 'Measurement'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'estimate')}
              disabled={saving}
              className="font-semibold py-3.5 rounded-2xl text-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)' }}
            >
              {saving && savingMode === 'estimate' ? '…' : 'Estimate'}
            </button>
          </div>
        )}
      </div>

    </form>
  )
}
