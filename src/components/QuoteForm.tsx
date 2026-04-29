'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { calculateQuote, fmt, type QuoteExtras } from '@/lib/calculations'
import type { CompanySettings, FlooringType, MeasurementType } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { formatPhone, formatExpiration } from '@/lib/format'
import { JOB_OPTION_GROUPS, type JobOptionsRecord } from '@/lib/jobOptions'
import {
  PlusCircle,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Users,
  X,
  Pencil,
  Copy,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react'

interface LineItemRow {
  id: string
  description: string
  qty: string
  unit_price: string
}

function newLineItem(): LineItemRow {
  return { id: crypto.randomUUID(), description: '', qty: '1', unit_price: '' }
}

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
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex items-center rounded-md overflow-hidden" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
        {prefix && <span className="px-3 py-2 text-sm border-r" style={{ color: 'var(--text-2)', borderColor: '#E5E7EB', background: '#FAFAFA' }}>{prefix}</span>}
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
          placeholder={placeholder} required={required}
          inputMode={inputMode}
          className="flex-1 min-w-0 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none bg-white text-gray-900"
        />
        {suffix && <span className="px-3 py-2 text-sm border-l" style={{ color: 'var(--text-2)', borderColor: '#E5E7EB', background: '#FAFAFA' }}>{suffix}</span>}
      </div>
      {hint && <p className="text-xs mt-1 text-gray-400">{hint}</p>}
    </div>
  )
}

function LineItem({ label, value, bold, muted }: { label: string; value: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? 'text-gray-400' : 'text-gray-700'}`}>
      <span className={bold ? 'font-semibold' : ''}>{label}</span>
      <span className={bold ? 'font-semibold text-gray-900' : 'font-medium'}>{fmt(value)}</span>
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
  scope_of_work?: string | null
  material_description?: string | null
  valid_days?: number
  section_flooring_types?: Record<string, FlooringType> | null
  section_pricing?: Record<string, { material: number; labor: number }> | null
  extras_json?: Record<string, number> | null
  job_options?: Record<string, boolean | string> | null
  pricing_mode?: string | null
  room_pricing?: Record<string, { material: number; labor: number }> | null
  line_items?: Array<{ description: string | null; qty: number; unit_price: number; total: number }>
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

  const [pricingMode, setPricingMode] = useState<'section' | 'room'>(
    (initialData?.pricing_mode as 'section' | 'room' | null | undefined) === 'room' ? 'room' : 'section'
  )

  const [roomPricing, setRoomPricing] = useState<Record<string, { material: string; labor: string }>>(() => {
    const saved = initialData?.room_pricing
    if (!saved || Object.keys(saved).length === 0) return {}
    const out: Record<string, { material: string; labor: string }> = {}
    Object.entries(saved).forEach(([k, v]) => {
      if (v && typeof v === 'object') {
        out[k] = { material: String(v.material), labor: String(v.labor) }
      }
    })
    return out
  })

  function setRoomRate(roomKey: string, kind: 'material' | 'labor', value: string) {
    setRoomPricing(prev => ({
      ...prev,
      [roomKey]: { ...(prev[roomKey] || { material: '', labor: '' }), [kind]: value },
    }))
  }

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
  const [materialDescription, setMaterialDescription] = useState(initialData?.material_description ?? '')
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

  // Job options (right-side checklist mirroring paper estimate forms)
  const [jobOptions, setJobOptions] = useState<JobOptionsRecord>(
    () => (initialData?.job_options as JobOptionsRecord | null | undefined) ?? {}
  )
  function toggleJobOption(key: string) {
    setJobOptions(prev => {
      const next = { ...prev }
      if (next[key] === true) delete next[key]
      else next[key] = true
      return next
    })
  }
  function setExclusiveJobOption(groupId: string, key: string) {
    const group = JOB_OPTION_GROUPS.find(g => g.id === groupId)
    if (!group) return
    setJobOptions(prev => {
      const next = { ...prev }
      // Clear other options in the same exclusive group
      group.options.forEach(o => { delete next[o.key] })
      // Toggle: if it was already set, leave cleared; otherwise set
      if (prev[key] !== true) next[key] = true
      return next
    })
  }
  function setJobOptionValue(key: string, value: string) {
    setJobOptions(prev => {
      const next = { ...prev }
      if (value.trim()) next[key] = value.trim()
      else delete next[key]
      return next
    })
  }


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
  const [scopeOfWork, setScopeOfWork] = useState(initialData?.scope_of_work ?? '')
  const [validDays, setValidDays] = useState(String(initialData?.valid_days ?? settings?.default_quote_valid_days ?? 30))

  // Additional line items (description / qty / unit_price). Total is computed.
  const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
    const seed = initialData?.line_items
    if (seed && seed.length > 0) {
      return seed.map(li => ({
        id: crypto.randomUUID(),
        description: li.description ?? '',
        qty: String(li.qty ?? 0),
        unit_price: String(li.unit_price ?? 0),
      }))
    }
    return []
  })

  const lineItemsTotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + n(li.qty) * n(li.unit_price), 0),
    [lineItems]
  )

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
  // Which section's flooring picker is expanded (null = all collapsed)
  const [openFlooringSection, setOpenFlooringSection] = useState<string | null>(null)
  const [manualFlooringOpen, setManualFlooringOpen] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(false)
  const [confirmRemoveSection, setConfirmRemoveSection] = useState<string | null>(null)

  // Auto-draft state (new quotes only)
  const draftIdRef = useRef<string | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSubmittingRef = useRef(false)
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const roomsSqft = rooms.reduce((sum, r) => sum + roomSqft(r), 0)
  const baseSqft = measurementType === 'manual' ? n(manualSqft) : roomsSqft

  const sectionSqftMap = useMemo(() => {
    const map: Record<string, number> = {}
    sections.forEach(s => { map[s] = 0 })
    rooms.forEach(r => { map[r.section] = (map[r.section] || 0) + roomSqft(r) })
    return map
  }, [rooms, sections])

  const wasteFactor = 1 + n(wastePct) / 100
  const materialTotalOverride = pricingMode === 'room' && measurementType === 'rooms'
    ? rooms.reduce((sum, r, idx) => {
        const rp = roomPricing[r.name.trim() || `__${idx}`]
        return sum + roomSqft(r) * wasteFactor * n(rp?.material || '0')
      }, 0)
    : measurementType === 'rooms'
      ? sections.reduce((sum, sec) => sum + (sectionSqftMap[sec] || 0) * wasteFactor * n(sectionPricing[sec]?.material || '0'), 0)
      : baseSqft * wasteFactor * n(sectionPricing[firstSection]?.material || '0')
  const laborTotalOverride = pricingMode === 'room' && measurementType === 'rooms'
    ? rooms.reduce((sum, r, idx) => {
        const rp = roomPricing[r.name.trim() || `__${idx}`]
        return sum + roomSqft(r) * wasteFactor * n(rp?.labor || '0')
      }, 0)
    : measurementType === 'rooms'
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
    line_items_total: lineItemsTotal,
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

  // ── Auto-draft: debounced save for new quotes ──────────────────────────────
  useEffect(() => {
    if (isEditing || isSubmittingRef.current) return

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(async () => {
      // Only persist once the user has entered something meaningful
      const hasData = customerName.trim() !== '' || baseSqft > 0
      if (!hasData) return

      setDraftStatus('saving')

      // Build rooms payload
      const roomsForDraft = measurementType === 'rooms'
        ? rooms.filter(r => roomSqft(r) > 0).map(r => ({
            name: r.name || null, section: r.section,
            length: n(r.lengthFt) + n(r.lengthIn) / 12,
            width: n(r.widthFt) + n(r.widthIn) / 12,
            sqft: roomSqft(r),
          }))
        : []

      const sectionPricingForDraft: Record<string, { material: number; labor: number }> = {}
      sections.forEach(sec => {
        const sp = sectionPricing[sec]
        if (sp) sectionPricingForDraft[sec] = { material: n(sp.material), labor: n(sp.labor) }
      })

      const extrasJsonDraft: Record<string, number> = {}
      Object.entries({
        subfloor_prep: n(subfloorPrep), underlayment_per_sqft: n(underlaymentPerSqft),
        transition_qty: n(transitionQty), transition_unit: n(transitionUnit),
        floor_protection: n(floorProtection), disposal_fee: n(disposalFee),
      }).forEach(([k, v]) => { if (v && v > 0) extrasJsonDraft[k] = v })

      const roomPricingForDraft: Record<string, { material: number; labor: number }> = {}
      if (pricingMode === 'room') {
        rooms.filter(r => roomSqft(r) > 0).forEach((r, idx) => {
          const key = r.name.trim() || `__${idx}`
          const rp = roomPricing[key]
          if (rp) roomPricingForDraft[key] = { material: n(rp.material), labor: n(rp.labor) }
        })
      }

      const draftPayload = {
        status: 'draft',
        customer_name: customerName.trim() || null,
        customer_phone: formatPhone(customerPhone) || null,
        customer_email: customerEmail || null,
        job_address: jobAddress || null,
        flooring_type: flooringType,
        section_flooring_types: sectionFlooring,
        section_pricing: sectionPricingForDraft,
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
        notes: [notes, blueprintNotes].filter(Boolean).join('\n\n') || null,
        scope_of_work: scopeOfWork.trim() || null,
        material_description: materialDescription.trim() || null,
        valid_days: n(validDays) || 30,
        extras_json: extrasJsonDraft,
        job_options: jobOptions,
        pricing_mode: pricingMode,
        room_pricing: Object.keys(roomPricingForDraft).length > 0 ? roomPricingForDraft : null,
        rooms: roomsForDraft,
        line_items: lineItems
          .filter(li => li.description.trim() || n(li.qty) > 0 || n(li.unit_price) > 0)
          .map((li, i) => ({
            position: i,
            description: li.description.trim() || null,
            qty: n(li.qty),
            unit_price: n(li.unit_price),
            total: +(n(li.qty) * n(li.unit_price)).toFixed(2),
          })),
      }

      try {
        if (draftIdRef.current) {
          const res = await fetch(`/api/quotes/${draftIdRef.current}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draftPayload),
          })
          setDraftStatus(res.ok ? 'saved' : 'error')
        } else {
          const res = await fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draftPayload),
          })
          if (res.ok) {
            const data = await res.json()
            draftIdRef.current = data.id
            setDraftStatus('saved')
          } else {
            setDraftStatus('error')
          }
        }
      } catch {
        setDraftStatus('error')
      }
    }, 2500)

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [
    isEditing, customerName, customerPhone, customerEmail, jobAddress,
    measurementType, manualSqft, rooms, sections, sectionFlooring, sectionPricing,
    wastePct, pricingMode, roomPricing,
    removalFee, furnitureFee, stairsFee, stairCount, deliveryFee, quarterRoundFee, reducersFee,
    customFeeLabel, customFeeAmount, taxEnabled, taxPct, markupPct, depositPct,
    notes, blueprintNotes, scopeOfWork, materialDescription, validDays,
    jobOptions, lineItems,
    subfloorPrep, underlaymentPerSqft, transitionQty, transitionUnit, floorProtection, disposalFee,
    finishType, woodSpecies, baseSqft, calcs, firstSection, showFinishFields, flooringType,
  ])
  // ── End auto-draft ─────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent, mode: 'measurement' | 'estimate' | 'update') {
    e.preventDefault()
    if (!customerName.trim()) { setError('Customer name is required'); return }
    if (baseSqft <= 0) { setError('Please enter square footage'); return }

    isSubmittingRef.current = true
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

    const roomPricingForApi: Record<string, { material: number; labor: number }> = {}
    if (pricingMode === 'room') {
      rooms.filter(r => roomSqft(r) > 0).forEach((r, idx) => {
        const key = r.name.trim() || `__${idx}`
        const rp = roomPricing[key]
        if (rp) roomPricingForApi[key] = { material: n(rp.material), labor: n(rp.labor) }
      })
    }

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
      scope_of_work: scopeOfWork.trim() || null,
      material_description: materialDescription.trim() || null,
      valid_days: n(validDays) || 30,
      extras_json: extrasJson,
      job_options: jobOptions,
      pricing_mode: pricingMode,
      room_pricing: Object.keys(roomPricingForApi).length > 0 ? roomPricingForApi : null,
      rooms: roomsForApi,
      line_items: lineItems
        .filter(li => li.description.trim() || n(li.qty) > 0 || n(li.unit_price) > 0)
        .map((li, i) => ({
          position: i,
          description: li.description.trim() || null,
          qty: n(li.qty),
          unit_price: n(li.unit_price),
          total: +(n(li.qty) * n(li.unit_price)).toFixed(2),
        })),
    }

    // If a draft was auto-saved, promote it via PATCH (preserves the ID and skips quota double-count)
    const hasDraft = !isEditing && draftIdRef.current !== null
    const url = isEditing
      ? `/api/quotes/${quoteId}`
      : hasDraft
        ? `/api/quotes/${draftIdRef.current}`
        : '/api/quotes'
    const method = isEditing || hasDraft ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        // Ask the PATCH route to assign a quote number when promoting from draft
        ...(hasDraft ? { _assign_quote_number: true } : {}),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      isSubmittingRef.current = false
      setError(data.error || 'Failed to save quote')
      setSaving(false)
      setSavingMode(null)
      return
    }
    // Navigate to the final quote — for draft promotions the PATCH returns { id }
    const finalId = isEditing ? quoteId : (hasDraft ? draftIdRef.current : data.id)
    router.push(`/quotes/${finalId}`)
    router.refresh()
  }

  // Total label for the mobile sticky bar
  const totalLabel = `${fmt(calcs.final_total)} • Material+Labor`
  const expirationLabel = formatExpiration(n(validDays) || 0)

  // Reusable checklist block — pill/chip buttons for easy mobile tapping
  const specGroups = JOB_OPTION_GROUPS
  const selectedCheckCount = Object.values(jobOptions).filter(v => v === true).length

  const jobSpecChecklist = (
    <div>
      {/* Header — tap to expand on mobile */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setChecklistOpen(v => !v)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setChecklistOpen(v => !v)}
        className="flex items-center justify-between select-none cursor-pointer lg:cursor-default lg:pointer-events-none"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Job scope</h2>
          {selectedCheckCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#1d1d1f' }}>
              {selectedCheckCount}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 lg:hidden ${checklistOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Checklist body — always visible on desktop, toggleable on mobile */}
      <div className={`mt-4 space-y-5 ${checklistOpen ? 'block' : 'hidden'} lg:block`}>
        {specGroups.map(group => (
          <div key={group.id}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{group.label}</span>
              {group.description && <p className="text-xs text-gray-400">{group.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map(opt => {
                const checked = jobOptions[opt.key] === true
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => group.exclusive ? setExclusiveJobOption(group.id, opt.key) : toggleJobOption(opt.key)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all select-none"
                    style={checked
                      ? { background: '#1d1d1f', color: 'white', border: '1.5px solid #1d1d1f' }
                      : { background: 'white', color: '#374151', border: '1.5px solid #E5E7EB' }
                    }
                  >
                    {checked && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        <div className="pt-3" style={{ borderTop: '1px solid #F1F1F4' }}>
          <Input
            label="Plank width"
            value={(jobOptions.width as string | undefined) ?? ''}
            onChange={(v) => setJobOptionValue('width', v)}
            placeholder='e.g. 5"'
          />
        </div>
      </div>
    </div>
  )

  return (
    <form onSubmit={(e) => handleSubmit(e, isEditing ? 'update' : 'measurement')} className="space-y-5 pb-24 lg:pb-0">
      {/* Draft save indicator */}
      {!isEditing && draftStatus !== 'idle' && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 h-4">
          {draftStatus === 'saving' && (
            <><Loader2 className="w-3 h-3 animate-spin" /> Saving draft…</>
          )}
          {draftStatus === 'saved' && (
            <><Check className="w-3 h-3 text-green-500" /> Draft saved</>
          )}
          {draftStatus === 'error' && (
            <span className="text-amber-600">Draft not saved — check connection</span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-3.5 py-2.5 rounded-md text-sm" style={{ border: '1px solid #FECACA' }}>{error}</div>
      )}

      {confirmRemoveSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Remove section &ldquo;{confirmRemoveSection}&rdquo;?</h3>
            <p className="text-sm text-gray-500 mb-5">This section has rooms. Removing it will also remove its rooms.</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setConfirmRemoveSection(null)} className="text-sm font-medium px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button type="button" onClick={() => confirmRemoveSectionNow(confirmRemoveSection)} className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors" style={{ background: 'var(--danger)' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Info */}
          <Card title="Customer info">
            <div className="flex items-center justify-end mb-4 -mt-1">
              <button
                type="button"
                onClick={openContactPicker}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-gray-700 transition-colors hover:bg-gray-50"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <Users className="w-3.5 h-3.5" />
                Load from Contacts
              </button>
            </div>

            {showContactPicker && (
              <div className="mb-4 rounded-md overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #F1F1F4', background: '#FAFAFA' }}>
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="flex-1 text-sm focus:outline-none bg-transparent text-gray-900 placeholder-gray-400"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowContactPicker(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto bg-white">
                  {contactsLoading ? (
                    <p className="text-sm text-center py-4 text-gray-400">Loading…</p>
                  ) : contacts.length === 0 ? (
                    <p className="text-sm text-center py-4 text-gray-400">No contacts saved yet</p>
                  ) : (
                    contacts
                      .filter(c => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickContact(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                          style={{ borderBottom: '1px solid #F5F5F7' }}
                        >
                          <p className="text-sm font-normal text-gray-800">{c.name}</p>
                          <p className="text-xs mt-0.5 text-gray-400">
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
          <Card title="Project settings">

            {/* Method toggle */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Measurement method</label>
              <div className="flex rounded-md p-1 gap-1 bg-gray-100">
                {(['rooms', 'manual'] as MeasurementType[]).map(m => (
                  <button key={m} type="button" onClick={() => setMeasurementType(m)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${
                      measurementType === m ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={measurementType === m ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } : undefined}
                  >
                    {m === 'rooms' ? 'By Rooms' : 'Total SqFt'}
                  </button>
                ))}
              </div>
            </div>

            {measurementType === 'manual' ? (
              <div className="space-y-4">
                <Input label="Total square footage" value={manualSqft} onChange={setManualSqft} type="number" suffix="sqft" placeholder="500" decimal />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Flooring type</label>
                  <button
                    type="button"
                    onClick={() => setManualFlooringOpen(v => !v)}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all select-none"
                    style={{ background: 'white', border: '1.5px solid #1d1d1f', color: '#1d1d1f' }}
                  >
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      {FLOORING_TYPES.find(t => t.value === (sectionFlooring[firstSection] || 'unfinished'))?.label ?? 'Select type'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${manualFlooringOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {manualFlooringOpen && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {FLOORING_TYPES.map(t => {
                        const active = (sectionFlooring[firstSection] || 'unfinished') === t.value
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => { setSectionFlooringType(firstSection, t.value); setManualFlooringOpen(false) }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all select-none"
                            style={active
                              ? { background: '#1d1d1f', color: 'white', border: '1.5px solid #1d1d1f' }
                              : { background: 'white', color: '#374151', border: '1.5px solid #E5E7EB' }
                            }
                          >
                            {active && <Check className="w-3 h-3 flex-shrink-0" />}
                            {t.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Blueprint upload (Pro tier only) */}
                {isPro ? (
                  <div className="border border-dashed rounded-md p-4 text-center transition-colors hover:bg-gray-50" style={{ borderColor: '#E5E7EB' }}>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBlueprintUpload} />
                    {blueprintLoading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        <p className="text-sm font-medium text-gray-700">Analyzing with AI…</p>
                        <p className="text-xs text-gray-400">~10–20 seconds per image</p>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 w-full py-2">
                        <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-50">
                          <Upload className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Upload blueprint or measurement sheet</p>
                          <p className="text-xs mt-0.5 text-gray-400">Select multiple images — one per floor is fine</p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <a
                    href="/billing/setup"
                    className="block border border-dashed rounded-md p-4 text-center transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-50">
                        <Upload className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Upload blueprint
                          <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}>Pro</span>
                        </p>
                        <p className="text-xs mt-0.5 text-gray-400">AI extracts every room — upgrade to enable</p>
                      </div>
                    </div>
                  </a>
                )}

                {blueprintError && (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md text-xs" style={{ border: '1px solid #FECACA' }}>
                    {blueprintError}
                  </div>
                )}

                {blueprintNotes && (
                  <div className="bg-amber-50 text-amber-800 px-3 py-2 rounded-md text-xs" style={{ border: '1px solid #FDE68A' }}>
                    <p className="font-medium mb-0.5">Notes extracted from image:</p>
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
                      <div key={section} className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                        {/* Section header */}
                        <div className="px-4 pt-3 pb-3" style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F1F4' }}>
                          {/* Name row — matches flooring dropdown in size */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 min-w-0">
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
                                  className="w-full px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none text-gray-900"
                                  style={{ border: '1.5px solid #1d1d1f', background: 'white' }}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditSection(section)}
                                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all select-none"
                                  style={{ background: 'white', border: '1.5px solid #E5E7EB', color: '#1d1d1f' }}
                                  title="Tap to rename"
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    <span className="truncate">{section}</span>
                                    <span className="text-xs font-normal text-gray-400 flex-shrink-0">
                                      · {sectionRooms.length} room{sectionRooms.length !== 1 ? 's' : ''}
                                      {sectionTotal > 0 ? ` · ${sectionTotal.toFixed(1)} sqft` : ''}
                                    </span>
                                  </span>
                                  <Pencil className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                                </button>
                              )}
                            </div>
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSection(section)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors flex-shrink-0"
                                title="Remove section"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {/* Flooring type — collapsed picker */}
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() => setOpenFlooringSection(openFlooringSection === section ? null : section)}
                              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all select-none"
                              style={{ background: 'white', border: '1.5px solid #1d1d1f', color: '#1d1d1f' }}
                            >
                              <span className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                {FLOORING_TYPES.find(t => t.value === secFlooring)?.label ?? 'Select type'}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openFlooringSection === section ? 'rotate-180' : ''}`} />
                            </button>
                            {openFlooringSection === section && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {FLOORING_TYPES.map(t => (
                                  <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => { setSectionFlooringType(section, t.value); setOpenFlooringSection(null) }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all select-none"
                                    style={secFlooring === t.value
                                      ? { background: '#1d1d1f', color: 'white', border: '1.5px solid #1d1d1f' }
                                      : { background: 'white', color: '#374151', border: '1.5px solid #E5E7EB' }
                                    }
                                  >
                                    {secFlooring === t.value && <Check className="w-3 h-3 flex-shrink-0" />}
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Room cards */}
                        <div className="p-3 space-y-2 bg-white">
                          {sectionRooms.map((room, idx) => (
                            <div key={room.id} className="rounded-lg overflow-hidden bg-white" style={{ border: '1px solid #E5E7EB' }}>
                              {/* Name strip */}
                              <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: '1px solid #F1F1F4' }}>
                                <input
                                  type="text"
                                  value={room.name}
                                  onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                                  placeholder={`Room ${idx + 1}`}
                                  className="flex-1 min-w-0 px-2 py-1 text-sm font-medium focus:outline-none bg-transparent text-gray-900 placeholder-gray-400"
                                />
                                <button
                                  type="button"
                                  onClick={() => duplicateRoom(room.id)}
                                  className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded flex-shrink-0"
                                  title="Duplicate room"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRoom(room.id)}
                                  disabled={rooms.length === 1}
                                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors rounded flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Dimensions — LENGTH then WIDTH stacked */}
                              <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1">
                                {(['length', 'width'] as const).map(dim => (
                                  <div key={dim} className="flex items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 w-10 flex-shrink-0">
                                      {dim === 'length' ? 'Length' : 'Width'}
                                    </span>
                                    <div className="flex gap-1.5 flex-1">
                                      <div className="flex items-center flex-1 rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                                        <input
                                          type="number" inputMode="numeric"
                                          value={dim === 'length' ? room.lengthFt : room.widthFt}
                                          onChange={e => updateRoom(room.id, dim === 'length' ? 'lengthFt' : 'widthFt', e.target.value)}
                                          placeholder="0"
                                          className="w-full py-3 text-lg font-semibold text-center focus:outline-none bg-white text-gray-900"
                                        />
                                        <span className="px-1.5 text-xs text-gray-400 self-stretch flex items-center flex-shrink-0" style={{ background: '#FAFAFA', borderLeft: '1px solid #E5E7EB' }}>ft</span>
                                      </div>
                                      <div className="flex items-center w-20 rounded-lg overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                                        <input
                                          type="number" inputMode="numeric"
                                          value={dim === 'length' ? room.lengthIn : room.widthIn}
                                          onChange={e => updateRoom(room.id, dim === 'length' ? 'lengthIn' : 'widthIn', e.target.value)}
                                          placeholder="0" min="0" max="11"
                                          className="w-full py-3 text-lg font-semibold text-center focus:outline-none bg-white text-gray-900"
                                        />
                                        <span className="pr-1.5 text-xs text-gray-400 flex-shrink-0">in</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Sqft result bar */}
                              {roomSqft(room) > 0 && (
                                <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#FAFAFA', borderTop: '1px solid #F1F1F4' }}>
                                  <span className="text-xs text-gray-400">{fmtDim(room)}</span>
                                  <span className="text-sm font-semibold text-gray-900">{roomSqft(room).toFixed(1)} sqft</span>
                                </div>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addRoom(section)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
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
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-gray-700 border border-dashed transition-colors hover:bg-gray-50"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add section
                  </button>

                  {/* Total bar */}
                  {roomsSqft > 0 && (
                    <div className="flex items-center justify-between rounded-md px-4 py-2.5" style={{ background: '#FAFAFA', border: '1px solid #F1F1F4' }}>
                      <span className="text-sm font-medium text-gray-700">Total measured</span>
                      <span className="text-sm font-semibold text-gray-900">{roomsSqft.toFixed(1)} sqft</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Job scope — standalone card below Project settings */}
          <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)' }}>
            {jobSpecChecklist}
          </div>

          {/* Pricing */}
          <Card title="Pricing">
            {/* Mode toggle — only meaningful for room-based measurements */}
            {measurementType === 'rooms' && (
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Pricing method</label>
                <div className="flex rounded-md p-1 gap-1 bg-gray-100">
                  {(['section', 'room'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPricingMode(mode)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded transition-all ${
                        pricingMode === mode ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'
                      }`}
                      style={pricingMode === mode ? { boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } : undefined}
                    >
                      {mode === 'section' ? 'Per section' : 'Per room'}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-1.5 text-gray-400">
                  {pricingMode === 'section'
                    ? 'One material + labor rate applies to all rooms in a section.'
                    : 'Each room gets its own material + labor rate.'}
                </p>
              </div>
            )}

            {/* Per-section rates */}
            {(measurementType === 'manual' || pricingMode === 'section') && (
              <div className="space-y-3">
                {(measurementType === 'manual' ? [firstSection] : sections).map(sec => (
                  <div key={sec}>
                    {measurementType === 'rooms' && sections.length > 1 && (
                      <p className="text-xs font-medium text-gray-500 mb-1.5">{sec}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {(['material', 'labor'] as const).map(kind => (
                        <div key={kind} className="flex items-center rounded-md bg-white overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                          <span className="px-2.5 py-2 text-sm border-r text-gray-600" style={{ borderColor: '#E5E7EB', background: '#FAFAFA' }}>$</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={sectionPricing[sec]?.[kind] || ''}
                            onChange={e => setSectionPricing(prev => ({
                              ...prev,
                              [sec]: { ...(prev[sec] || { material: '', labor: '' }), [kind]: e.target.value },
                            }))}
                            placeholder={kind === 'material' ? '5.00' : '3.00'}
                            className="flex-1 min-w-0 px-2 py-2 text-sm focus:outline-none bg-transparent text-gray-900"
                          />
                          <span className="px-2 py-2 text-[10px] font-medium border-l whitespace-nowrap text-gray-400" style={{ borderColor: '#E5E7EB', background: '#FAFAFA' }}>
                            {kind === 'material' ? 'MAT' : 'LAB'}<br />
                            <span className="font-normal">/sqft</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Per-room rates */}
            {measurementType === 'rooms' && pricingMode === 'room' && (
              <div className="space-y-4">
                {sections.map(sec => {
                  const secRooms = rooms.filter(r => r.section === sec && roomSqft(r) > 0)
                  if (secRooms.length === 0) return null
                  return (
                    <div key={sec}>
                      {sections.length > 1 && (
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{sec}</p>
                      )}
                      <div className="space-y-2">
                        {secRooms.map((room, idx) => {
                          const sqft = roomSqft(room)
                          const key = room.name.trim() || `__${rooms.indexOf(room)}`
                          const rp = roomPricing[key]
                          return (
                            <div key={room.id} className="rounded-md p-3 bg-gray-50" style={{ border: '1px solid #F1F1F4' }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-800">
                                  {room.name.trim() || `Room ${idx + 1}`}
                                </span>
                                {sqft > 0 && (
                                  <span className="text-xs text-gray-400">{sqft.toFixed(1)} sqft</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {(['material', 'labor'] as const).map(kind => (
                                  <div key={kind} className="flex items-center rounded-md bg-white overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                                    <span className="px-2.5 py-2 text-sm border-r text-gray-600" style={{ borderColor: '#E5E7EB', background: '#FAFAFA' }}>$</span>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={rp?.[kind] || ''}
                                      onChange={e => setRoomRate(key, kind, e.target.value)}
                                      placeholder={kind === 'material' ? '5.00' : '3.00'}
                                      className="flex-1 min-w-0 px-2 py-2 text-sm focus:outline-none bg-transparent text-gray-900"
                                    />
                                    <span className="px-2 py-2 text-[10px] font-medium border-l whitespace-nowrap text-gray-400" style={{ borderColor: '#E5E7EB', background: '#FAFAFA' }}>
                                      {kind === 'material' ? 'MAT' : 'LAB'}<br />
                                      <span className="font-normal">/sqft</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {rooms.filter(r => roomSqft(r) > 0).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">Add rooms with dimensions above to set per-room rates.</p>
                )}
              </div>
            )}
          </Card>

          {/* Extras */}
          <Card title="Extras & add-ons">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Waste %" value={wastePct} onChange={setWastePct} type="number" suffix="%" placeholder="10" decimal />
              <Input label="Removal fee" value={removalFee} onChange={setRemovalFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Furniture moving" value={furnitureFee} onChange={setFurnitureFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Quarter round / moldings" value={quarterRoundFee} onChange={setQuarterRoundFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Reducers / saddles" value={reducersFee} onChange={setReducersFee} type="number" prefix="$" placeholder="0" decimal />
              <Input label="Delivery fee" value={deliveryFee} onChange={setDeliveryFee} type="number" prefix="$" placeholder="0" decimal />
            </div>

            {/* Stairs row */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F1F1F4' }}>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="# of stairs"
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
                  label="Stairs fee"
                  value={stairsFee}
                  onChange={setStairsFee}
                  type="number"
                  prefix="$"
                  placeholder="0"
                  decimal
                />
              </div>
              <p className="text-xs mt-2 text-gray-400">
                Charged as a flat total. To bill per step, divide and enter total here — or enter # of stairs and the per-step rate to auto-compute.
              </p>
            </div>

            {/* Material description */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F1F1F4' }}>
              <label className="block text-xs font-medium text-gray-500 mb-1">Material description</label>
              <textarea
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                rows={3}
                placeholder={'e.g. Install and supply #1 3-1/4" red oak hardwood flooring, waste is included, finish w/ 2 coats poly (oil base), stain is included.'}
                className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] placeholder:text-gray-400 bg-white text-gray-900"
                style={{ border: '1px solid #E5E7EB' }}
              />
              <p className="text-xs mt-1 text-gray-400">
                Optional descriptive detail shown above the Material line on the quote PDF and in the on-screen breakdown.
              </p>
            </div>

            <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid #F1F1F4' }}>
              <Input label="Custom fee label" value={customFeeLabel} onChange={setCustomFeeLabel} placeholder="Other" />
              <Input label="Custom fee amount" value={customFeeAmount} onChange={setCustomFeeAmount} type="number" prefix="$" placeholder="0" decimal />
            </div>

            {/* Show all extras toggle */}
            <button
              type="button"
              onClick={() => setShowAllExtras(v => !v)}
              className="mt-4 flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showAllExtras ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {showAllExtras ? 'Hide extras' : 'Show all extras'}
            </button>

            {showAllExtras && (
              <div className="mt-3 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: '1px solid #F1F1F4' }}>
                <Input label="Subfloor prep" value={subfloorPrep} onChange={setSubfloorPrep} type="number" prefix="$" placeholder="0" decimal hint="Flat fee" />
                <Input label="Underlayment" value={underlaymentPerSqft} onChange={setUnderlaymentPerSqft} type="number" prefix="$" placeholder="0" decimal hint="Per adjusted sqft" />
                <Input label="Transition strips (qty)" value={transitionQty} onChange={setTransitionQty} type="number" placeholder="0" />
                <Input label="Transition $/each" value={transitionUnit} onChange={setTransitionUnit} type="number" prefix="$" placeholder="0" decimal />
                <Input label="Floor protection" value={floorProtection} onChange={setFloorProtection} type="number" prefix="$" placeholder="0" decimal hint="Flat fee" />
                <Input label="Disposal / dump fee" value={disposalFee} onChange={setDisposalFee} type="number" prefix="$" placeholder="0" decimal hint="Flat fee" />
              </div>
            )}
          </Card>

          {/* Additional Line Items */}
          <Card title="Additional line items" description="Custom rows that fold into the subtotal (after extras, before tax/markup).">
            <div className="space-y-2">
              {/* Header row (sm+) */}
              {lineItems.length > 0 && (
                <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-xs text-gray-400 font-normal">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-3">Unit price</span>
                  <span className="col-span-1 text-right">Total</span>
                  <span className="col-span-1" />
                </div>
              )}

              {lineItems.map((item, i) => {
                const rowTotal = n(item.qty) * n(item.unit_price)
                return (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, description: e.target.value } : li))}
                      placeholder="Description"
                      className="col-span-12 sm:col-span-5 w-full px-3 py-2 rounded-md text-sm focus:outline-none placeholder-gray-400 bg-white text-gray-900"
                      style={{ border: '1px solid #E5E7EB' }}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={item.qty}
                      onChange={e => setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, qty: e.target.value } : li))}
                      placeholder="Qty"
                      min="0"
                      className="col-span-3 sm:col-span-2 w-full px-3 py-2 rounded-md text-sm focus:outline-none bg-white text-gray-900"
                      style={{ border: '1px solid #E5E7EB' }}
                    />
                    <div className="col-span-5 sm:col-span-3 flex items-center rounded-md bg-white overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                      <span className="px-2.5 py-2 text-sm text-gray-500 bg-gray-50" style={{ borderRight: '1px solid #E5E7EB' }}>$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={item.unit_price}
                        onChange={e => setLineItems(prev => prev.map((li, idx) => idx === i ? { ...li, unit_price: e.target.value } : li))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="flex-1 min-w-0 px-2.5 py-2 text-sm focus:outline-none bg-transparent placeholder-gray-400 text-gray-900"
                      />
                    </div>
                    <p className="col-span-3 sm:col-span-1 text-sm font-medium text-right truncate text-gray-900">
                      {fmt(rowTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}
                      className="col-span-1 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors flex justify-center"
                      title="Remove line item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}

              <button
                type="button"
                onClick={() => setLineItems(prev => [...prev, newLineItem()])}
                className="flex items-center gap-1.5 text-sm font-medium mt-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid #E5E7EB' }}
              >
                <Plus className="w-4 h-4" /> Add line item
              </button>

              {lineItemsTotal > 0 && (
                <div className="flex items-center justify-between pt-3 mt-2 text-sm" style={{ borderTop: '1px solid #F1F1F4' }}>
                  <span className="font-medium text-gray-700">Line items total</span>
                  <span className="font-semibold text-gray-900">{fmt(lineItemsTotal)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Tax */}
          <Card title="Tax">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setTaxEnabled(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${taxEnabled ? '' : 'bg-gray-200'}`}
                style={taxEnabled ? { background: 'var(--button-dark)' } : undefined}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${taxEnabled ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm font-medium text-gray-900">Apply sales tax</span>
            </div>
            {taxEnabled && <Input label="Tax rate" value={taxPct} onChange={setTaxPct} type="number" suffix="%" placeholder="8.5" decimal />}
          </Card>

          {/* Profit & Deposit */}
          <Card title="Profit & deposit">
            <div className="grid grid-cols-2 gap-3">
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
          <Card title="Notes & validity">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    rows={3} placeholder="Any additional notes for the customer…"
                    className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] placeholder-gray-400 bg-white text-gray-900"
                    style={{ border: '1px solid #E5E7EB' }}
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Scope of work / exclusions</label>
                <textarea
                  value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)}
                  rows={3}
                  placeholder="e.g. Finishing stringers, risers, railings, spindles and bullnose are not included in this price."
                  className="w-full px-3 py-2 rounded-md text-sm focus:outline-none resize-none min-h-[80px] placeholder-gray-400 bg-white text-gray-900"
                  style={{ border: '1px solid #E5E7EB' }}
                />
                <p className="text-xs mt-1 text-gray-400">
                  Shown prominently on the quote PDF and email above the totals.
                </p>
              </div>
              <Input
                label="Lockbox / Key"
                value={(jobOptions.lockbox_key_value as string | undefined) ?? ''}
                onChange={(v) => setJobOptionValue('lockbox_key_value', v)}
                placeholder="Code or note for access"
              />
            </div>
          </Card>

        </div>

        {/* Right — live totals (desktop only) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-4 space-y-3">
            <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Live estimate</h2>

              {/* Section breakdown */}
              {measurementType === 'rooms' && activeSections.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  {activeSections.map(section => {
                    const s = rooms.filter(r => r.section === section)
                    const sqft = s.reduce((sum, r) => sum + roomSqft(r), 0)
                    if (sqft === 0) return null
                    return (
                      <div key={section} className="flex justify-between text-xs">
                        <span className="font-medium text-gray-700 truncate max-w-[60%]">{section}</span>
                        <span className="text-gray-500">{sqft.toFixed(0)} sqft</span>
                      </div>
                    )
                  })}
                  <div className="pt-1.5" style={{ borderTop: '1px solid #F1F1F4' }} />
                </div>
              )}

              <div className="rounded-md p-3 mb-4 text-center" style={{ background: '#FAFAFA' }}>
                <p className="text-2xl font-semibold text-gray-900">{calcs.adjusted_sqft.toFixed(0)}</p>
                <p className="text-xs mt-0.5 text-gray-500">adjusted sqft (incl. {n(wastePct)}% waste)</p>
              </div>

              <div className="space-y-2.5">
                <LineItem label="Material" value={calcs.material_total} />
                <LineItem label="Labor" value={calcs.labor_total} />
                {calcs.extras_total > 0 && <LineItem label="Extras" value={calcs.extras_total} />}
                <div className="pt-2.5" style={{ borderTop: '1px solid #F1F1F4' }}>
                  <LineItem label="Subtotal" value={calcs.subtotal} bold />
                </div>
                {taxEnabled && calcs.tax_amount > 0 && <LineItem label={`Tax (${n(taxPct)}%)`} value={calcs.tax_amount} />}
                {calcs.markup_amount > 0 && <LineItem label={`Profit (${n(markupPct)}%)`} value={calcs.markup_amount} />}
              </div>

              <div className="mt-3 pt-3" style={{ borderTop: '1px solid #E5E7EB' }}>
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-semibold text-gray-900">{fmt(calcs.final_total)}</span>
                </div>
              </div>

              <div className="mt-3 rounded-md p-3 space-y-2" style={{ background: 'var(--primary-light)' }}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium" style={{ color: 'var(--primary)' }}>Deposit ({n(depositPct)}%)</span>
                  <span className="font-semibold" style={{ color: 'var(--primary)' }}>{fmt(calcs.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Balance due</span>
                  <span className="font-medium">{fmt(calcs.remaining_balance)}</span>
                </div>
              </div>
            </div>

            {/* Save buttons (desktop) — teal CTA per design system */}
            {isEditing ? (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'update')}
                disabled={saving}
                className="w-full text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50"
                style={{ background: '#1d1d1f' }}
              >
                {saving ? 'Saving…' : 'Update quote'}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'measurement')}
                  disabled={saving}
                  className="w-full text-white text-sm font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50"
                  style={{ background: '#1d1d1f' }}
                >
                  {saving && savingMode === 'measurement' ? 'Saving…' : 'Save as measurement'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'estimate')}
                  disabled={saving}
                  className="w-full text-sm font-medium py-2.5 px-4 rounded-md transition-colors disabled:opacity-50 hover:bg-gray-50"
                  style={{ background: 'white', color: 'var(--text)', border: '1px solid #E5E7EB' }}
                >
                  {saving && savingMode === 'estimate' ? 'Saving…' : 'Save as estimate'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar with live total + save buttons */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Total</span>
          <span className="text-sm font-semibold text-gray-900">{totalLabel}</span>
        </div>
        {isEditing ? (
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'update')}
            disabled={saving}
            className="w-full text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
            style={{ background: '#1d1d1f' }}
          >
            {saving ? 'Saving…' : 'Update quote'}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'measurement')}
              disabled={saving}
              className="text-white text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
              style={{ background: '#1d1d1f' }}
            >
              {saving && savingMode === 'measurement' ? '…' : 'Measurement'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'estimate')}
              disabled={saving}
              className="text-sm font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 hover:bg-gray-50"
              style={{ background: 'white', color: 'var(--text)', border: '1px solid #E5E7EB' }}
            >
              {saving && savingMode === 'estimate' ? '…' : 'Estimate'}
            </button>
          </div>
        )}
      </div>

    </form>
  )
}
