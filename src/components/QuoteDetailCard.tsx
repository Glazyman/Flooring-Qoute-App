'use client'

import { useState, useRef } from 'react'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel, FLOORING_LABEL } from '@/lib/flooringLabels'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'

const BAND_BG = '#94a3b8'
const FRAME_BORDER = '1px solid #0f172a'
const ROW_BORDER = '0.5px solid #e2e8f0'
const HOVER_BG = 'rgba(0,113,227,0.06)'
const TEAL = '#0071e3'

function fmtNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function fmtQty(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return new Intl.NumberFormat('en-US').format(rounded)
  }
  return fmtNumber(rounded, 2)
}

// ---- Editable block field (for customer name, address, notes, etc.) ----
interface EditableFieldProps {
  fieldKey: string
  value: string
  editing: string | null
  saved: string | null
  onEdit: (key: string) => void
  onSave: (key: string, rawValue: string) => void
  multiline?: boolean
  textClassName?: string
  textStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
  placeholder?: string
}

function EditableField({
  fieldKey,
  value,
  editing,
  saved,
  onEdit,
  onSave,
  multiline = false,
  textClassName = '',
  textStyle = {},
  inputStyle = {},
  placeholder = 'Click to add…',
}: EditableFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cancelRef = useRef(false)

  const commit = () => {
    if (cancelRef.current) { cancelRef.current = false; return }
    const val = (inputRef.current?.value ?? textareaRef.current?.value) ?? value
    onSave(fieldKey, val)
  }

  const isEditing = editing === fieldKey
  const isSaved = saved === fieldKey

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderBottom: `1px solid ${TEAL}`,
    outline: 'none',
    background: 'transparent',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    padding: 0,
    lineHeight: 'inherit',
    ...inputStyle,
  }

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          autoFocus
          defaultValue={value}
          onBlur={commit}
          rows={3}
          style={{ ...baseInputStyle, resize: 'vertical' }}
        />
      )
    }
    return (
      <input
        ref={inputRef}
        type="text"
        autoFocus
        defaultValue={value}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { cancelRef.current = true; onEdit('') }
        }}
        style={baseInputStyle}
      />
    )
  }

  return (
    <span
      onClick={() => onEdit(fieldKey)}
      className={textClassName}
      style={{
        cursor: 'text',
        display: 'inline-block',
        width: '100%',
        borderRadius: 2,
        transition: 'background 0.1s',
        ...textStyle,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = HOVER_BG)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      title="Click to edit"
    >
      {value || <span style={{ opacity: 0.35, fontStyle: 'italic' }}>{placeholder}</span>}
      {isSaved && <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>}
    </span>
  )
}

// ---- Editable table cell ----
interface EditableCellProps {
  fieldKey: string
  value: string
  editing: string | null
  saved: string | null
  onEdit: (key: string) => void
  onSave: (key: string, rawValue: string) => void
  align?: 'left' | 'right'
  cellClassName?: string
}

function EditableCell({
  fieldKey,
  value,
  editing,
  saved,
  onEdit,
  onSave,
  align = 'left',
  cellClassName = '',
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelRef = useRef(false)

  const commit = () => {
    if (cancelRef.current) { cancelRef.current = false; return }
    const val = inputRef.current?.value ?? value
    onSave(fieldKey, val)
  }

  const isEditing = editing === fieldKey
  const isSaved = saved === fieldKey

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        autoFocus
        defaultValue={value}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { cancelRef.current = true; onEdit('') }
        }}
        style={{
          width: '100%',
          border: 'none',
          borderBottom: `1px solid ${TEAL}`,
          outline: 'none',
          background: 'transparent',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          color: 'inherit',
          padding: 0,
          textAlign: align,
        }}
      />
    )
  }

  return (
    <span
      onClick={() => onEdit(fieldKey)}
      style={{
        cursor: 'text',
        display: 'block',
        width: '100%',
        textAlign: align,
        borderRadius: 2,
        transition: 'background 0.1s',
      }}
      className={cellClassName}
      onMouseEnter={e => (e.currentTarget.style.background = HOVER_BG)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      title="Click to edit"
    >
      {value || <span style={{ opacity: 0.3 }}>—</span>}
      {isSaved && <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>}
    </span>
  )
}

// ---- Main component ----

export interface QuoteDetailCardProps {
  quote: Quote
  rooms: QuoteRoom[]
  initialLineItems: QuoteLineItem[]
  settings: CompanySettings | null
  terms: string[]
  dateStr: string
}

export default function QuoteDetailCard({
  quote: q,
  rooms,
  initialLineItems,
  settings,
  terms,
  dateStr,
}: QuoteDetailCardProps) {
  // Precompute stair count for state initializer
  const stairCount = q.stair_count && q.stair_count > 0 ? q.stair_count : null

  // Editable quote fields
  const [customerName, setCustomerName] = useState(q.customer_name)
  const [customerPhone, setCustomerPhone] = useState(q.customer_phone ?? '')
  const [jobAddress, setJobAddress] = useState(q.job_address ?? '')
  const [quoteNumber, setQuoteNumber] = useState(q.quote_number ?? '')
  const [materialDescription, setMaterialDescription] = useState(q.material_description ?? '')
  const [scopeOfWork, setScopeOfWork] = useState(q.scope_of_work ?? '')
  const [notesValue, setNotesValue] = useState(q.notes ?? '')
  const [materialRate, setMaterialRate] = useState(q.material_cost_per_sqft)
  const [laborRate, setLaborRate] = useState(q.labor_cost_per_sqft)

  // Editable sqft
  const [adjustedSqft, setAdjustedSqft] = useState(q.adjusted_sqft)

  // Fixed fee amounts
  const [removalFee, setRemovalFee] = useState(q.removal_fee ?? 0)
  const [furnitureFee, setFurnitureFee] = useState(q.furniture_fee ?? 0)
  const [stairsFee, setStairsFee] = useState(q.stairs_fee ?? 0)
  const [quarterRoundFee, setQuarterRoundFee] = useState(q.quarter_round_fee ?? 0)
  const [reducersFee, setReducersFee] = useState(q.reducers_fee ?? 0)
  const [deliveryFee, setDeliveryFee] = useState(q.delivery_fee ?? 0)
  const [customFeeAmount, setCustomFeeAmount] = useState(q.custom_fee_amount ?? 0)
  const [customFeeLabel, setCustomFeeLabel] = useState(q.custom_fee_label ?? '')

  // Fixed fee description overrides (local only — no persistence)
  const [removalFeeDesc, setRemovalFeeDesc] = useState('Removal of existing flooring')
  const [furnitureFeeDesc, setFurnitureFeeDesc] = useState('Furniture moving')
  const [stairsFeeDesc, setStairsFeeDesc] = useState(stairCount ? `Stairs (${stairCount})` : 'Stairs')
  const [quarterRoundFeeDesc, setQuarterRoundFeeDesc] = useState('Quarter round / moldings')
  const [reducersFeeDesc, setReducersFeeDesc] = useState('Reducers / saddles')
  const [deliveryFeeDesc, setDeliveryFeeDesc] = useState('Delivery')

  // Extras JSON state (for editable extras)
  const [extrasJson, setExtrasJson] = useState<Record<string, number>>(
    (q.extras_json ?? {}) as Record<string, number>
  )
  const [subfloorPrepDesc, setSubfloorPrepDesc] = useState('Subfloor prep')
  const [floorProtectionDesc, setFloorProtectionDesc] = useState('Floor protection')
  const [disposalFeeDesc, setDisposalFeeDesc] = useState('Disposal / dump fee')

  // Line items
  const [items, setItems] = useState<QuoteLineItem[]>(initialLineItems)
  const [addingRow, setAddingRow] = useState(false)

  // Edit/save state
  const [editing, setEditing] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // Select mode
  const [selectMode, setSelectMode] = useState(false)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const flashSaved = (key: string) => {
    setSaved(key)
    setTimeout(() => setSaved(s => (s === key ? null : s)), 1500)
  }

  function handleSelectAll() {
    const allKeys = new Set<string>()
    if (!canRenderPerSection && q.adjusted_sqft > 0) allKeys.add('row-material')
    if (!canRenderPerSection && laborRate > 0) allKeys.add('row-labor')
    items.forEach(li => allKeys.add(`li-${li.id}`))
    if (removalFee > 0) allKeys.add('fee-removal')
    if (furnitureFee > 0) allKeys.add('fee-furniture')
    if (stairsFee > 0) allKeys.add('fee-stairs')
    if (quarterRoundFee > 0) allKeys.add('fee-quarterround')
    if (reducersFee > 0) allKeys.add('fee-reducers')
    if (deliveryFee > 0) allKeys.add('fee-delivery')
    if (customFeeAmount > 0 && customFeeLabel.trim()) allKeys.add('fee-custom')
    if ((extrasJson.subfloor_prep ?? 0) > 0) allKeys.add('fee-subfloor')
    if ((extrasJson.underlayment_per_sqft ?? 0) > 0 && adjustedSqft > 0) allKeys.add('fee-underlayment')
    if ((extrasJson.transition_qty ?? 0) > 0 && (extrasJson.transition_unit ?? 0) > 0) allKeys.add('fee-transition')
    if ((extrasJson.floor_protection ?? 0) > 0) allKeys.add('fee-floorprotection')
    if ((extrasJson.disposal_fee ?? 0) > 0) allKeys.add('fee-disposal')
    setSelectedKeys(allKeys)
  }

  async function handleDeleteSelected() {
    const keys = Array.from(selectedKeys)

    const lineItemDeletes = keys
      .filter(k => k.startsWith('li-'))
      .map(k => {
        const id = k.slice(3)
        return fetch(`/api/quote-line-items/${id}`, { method: 'DELETE' })
      })

    // Collect quote field patches
    const quotePatch: Record<string, number> = {}
    if (keys.includes('row-material')) { quotePatch.adjusted_sqft = 0 }
    if (keys.includes('row-labor')) { quotePatch.labor_cost_per_sqft = 0 }
    if (keys.includes('fee-removal')) { quotePatch.removal_fee = 0 }
    if (keys.includes('fee-furniture')) { quotePatch.furniture_fee = 0 }
    if (keys.includes('fee-stairs')) { quotePatch.stairs_fee = 0 }
    if (keys.includes('fee-quarterround')) { quotePatch.quarter_round_fee = 0 }
    if (keys.includes('fee-reducers')) { quotePatch.reducers_fee = 0 }
    if (keys.includes('fee-delivery')) { quotePatch.delivery_fee = 0 }
    if (keys.includes('fee-custom')) { quotePatch.custom_fee_amount = 0 }

    // Collect extras patches
    let newExtras = { ...extrasJson }
    let extrasChanged = false
    if (keys.includes('fee-subfloor')) { newExtras = { ...newExtras, subfloor_prep: 0 }; extrasChanged = true }
    if (keys.includes('fee-underlayment')) { newExtras = { ...newExtras, underlayment_per_sqft: 0 }; extrasChanged = true }
    if (keys.includes('fee-transition')) { newExtras = { ...newExtras, transition_qty: 0, transition_unit: 0 }; extrasChanged = true }
    if (keys.includes('fee-floorprotection')) { newExtras = { ...newExtras, floor_protection: 0 }; extrasChanged = true }
    if (keys.includes('fee-disposal')) { newExtras = { ...newExtras, disposal_fee: 0 }; extrasChanged = true }

    if (extrasChanged) {
      quotePatch.extras_json = newExtras as unknown as number
    }

    const apiCalls: Promise<unknown>[] = [...lineItemDeletes]
    if (Object.keys(quotePatch).length > 0) {
      apiCalls.push(
        fetch(`/api/quotes/${q.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotePatch),
        })
      )
    }

    // Optimistic state updates
    const liIds = keys.filter(k => k.startsWith('li-')).map(k => k.slice(3))
    if (liIds.length > 0) setItems(prev => prev.filter(li => !liIds.includes(li.id)))
    if (keys.includes('row-material')) setAdjustedSqft(0)
    if (keys.includes('row-labor')) setLaborRate(0)
    if (keys.includes('fee-removal')) setRemovalFee(0)
    if (keys.includes('fee-furniture')) setFurnitureFee(0)
    if (keys.includes('fee-stairs')) setStairsFee(0)
    if (keys.includes('fee-quarterround')) setQuarterRoundFee(0)
    if (keys.includes('fee-reducers')) setReducersFee(0)
    if (keys.includes('fee-delivery')) setDeliveryFee(0)
    if (keys.includes('fee-custom')) setCustomFeeAmount(0)
    if (extrasChanged) setExtrasJson(newExtras)

    await Promise.all(apiCalls).catch(() => {})

    setSelectedKeys(new Set())
    setSelectMode(false)
  }

  // Save quote field to API
  async function handleSave(field: string, rawValue: string) {
    // Handle extras_json fields via a dedicated path
    if (field.startsWith('extras_')) {
      const extrasKey = field.slice('extras_'.length)
      const newValue = parseFloat(rawValue) || 0
      const newExtras = { ...extrasJson, [extrasKey]: newValue }
      setExtrasJson(newExtras)
      setEditing(null)
      fetch(`/api/quotes/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extras_json: newExtras }),
      }).then(() => flashSaved(field)).catch(() => {})
      return
    }

    const numericFields = [
      'material_cost_per_sqft', 'labor_cost_per_sqft', 'adjusted_sqft',
      'removal_fee', 'furniture_fee', 'stairs_fee', 'quarter_round_fee',
      'reducers_fee', 'delivery_fee', 'custom_fee_amount',
    ]
    const apiValue = numericFields.includes(field) ? parseFloat(rawValue) || 0 : rawValue

    // Optimistic update
    switch (field) {
      case 'customer_name': setCustomerName(rawValue); break
      case 'customer_phone': setCustomerPhone(rawValue); break
      case 'job_address': setJobAddress(rawValue); break
      case 'quote_number': setQuoteNumber(rawValue); break
      case 'material_description': setMaterialDescription(rawValue); break
      case 'scope_of_work': setScopeOfWork(rawValue); break
      case 'notes': setNotesValue(rawValue); break
      case 'material_cost_per_sqft': setMaterialRate(parseFloat(rawValue) || 0); break
      case 'labor_cost_per_sqft': setLaborRate(parseFloat(rawValue) || 0); break
      case 'adjusted_sqft': setAdjustedSqft(parseFloat(rawValue) || 0); break
      case 'removal_fee': setRemovalFee(parseFloat(rawValue) || 0); break
      case 'furniture_fee': setFurnitureFee(parseFloat(rawValue) || 0); break
      case 'stairs_fee': setStairsFee(parseFloat(rawValue) || 0); break
      case 'quarter_round_fee': setQuarterRoundFee(parseFloat(rawValue) || 0); break
      case 'reducers_fee': setReducersFee(parseFloat(rawValue) || 0); break
      case 'delivery_fee': setDeliveryFee(parseFloat(rawValue) || 0); break
      case 'custom_fee_amount': setCustomFeeAmount(parseFloat(rawValue) || 0); break
      case 'custom_fee_label': setCustomFeeLabel(rawValue); break
    }

    setEditing(null)

    fetch(`/api/quotes/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: apiValue }),
    }).then(() => flashSaved(field)).catch(() => {})
  }

  // Save stairs rate (rate × count → stairs_fee total)
  function handleStairsRateSave(key: string, rawValue: string) {
    const newRate = parseFloat(rawValue) || 0
    const cnt = q.stair_count && q.stair_count > 0 ? q.stair_count : 1
    const newTotal = newRate * cnt
    setStairsFee(newTotal)
    setEditing(null)
    fetch(`/api/quotes/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stairs_fee: newTotal }),
    }).then(() => flashSaved(key)).catch(() => {})
  }

  // Local-only description save (no API call)
  function handleLocalDescSave(
    setter: React.Dispatch<React.SetStateAction<string>>,
    key: string,
    val: string,
  ) {
    setter(val)
    setEditing(null)
    flashSaved(key)
  }

  // Save line item field to API
  async function handleLineItemSave(id: string, field: 'description' | 'qty' | 'unit_price', rawValue: string) {
    const item = items.find(li => li.id === id)
    if (!item) return

    const newItem = { ...item }
    if (field === 'description') {
      newItem.description = rawValue
    } else if (field === 'qty') {
      newItem.qty = parseFloat(rawValue) || 0
      newItem.total = newItem.qty * newItem.unit_price
    } else if (field === 'unit_price') {
      newItem.unit_price = parseFloat(rawValue) || 0
      newItem.total = newItem.qty * newItem.unit_price
    }

    setItems(prev => prev.map(li => (li.id === id ? newItem : li)))
    setEditing(null)

    const saveKey = `li-${id}-${field}`
    fetch(`/api/quote-line-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: newItem.description,
        qty: newItem.qty,
        unit_price: newItem.unit_price,
        total: newItem.total,
      }),
    }).then(() => flashSaved(saveKey)).catch(() => {})
  }

  // Delete a custom line item
  async function deleteLineItem(id: string) {
    setItems(prev => prev.filter(li => li.id !== id))
    fetch(`/api/quote-line-items/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  // Zero out a fixed-fee field (removes the row visually)
  async function deleteFixedFee(field: string, setter: React.Dispatch<React.SetStateAction<number>>) {
    setter(0)
    fetch(`/api/quotes/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: 0 }),
    }).catch(() => {})
  }

  // Zero out an extras_json key
  async function deleteExtrasKey(key: string) {
    const newExtras = { ...extrasJson, [key]: 0 }
    setExtrasJson(newExtras)
    fetch(`/api/quotes/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extras_json: newExtras }),
    }).catch(() => {})
  }

  const onEdit = (key: string) => setEditing(key || null)

  async function addLineItem() {
    setAddingRow(true)
    try {
      const res = await fetch(`/api/quotes/${q.id}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: '', qty: 0, unit_price: 0, total: 0, position: items.length }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          const newItem: QuoteLineItem = {
            id: data.id,
            quote_id: q.id,
            position: items.length,
            description: '',
            qty: 0,
            unit_price: 0,
            total: 0,
            created_at: new Date().toISOString(),
          }
          setItems(prev => [...prev, newItem])
          // Auto-focus the new row's description
          setTimeout(() => setEditing(`li-${data.id}-description`), 50)
        }
      }
    } finally {
      setAddingRow(false)
    }
  }

  // ---- Section pricing logic ----
  const sectionPricing =
    (q as unknown as {
      section_pricing?: Record<string, { material: number; labor: number }> | null
    }).section_pricing ?? null

  const sectionKeys = sectionPricing ? Object.keys(sectionPricing) : []
  const roomsBySection: Record<string, number> = {}
  rooms.forEach(r => {
    const key = r.section || 'Main Floor'
    roomsBySection[key] = (roomsBySection[key] ?? 0) + (Number(r.sqft) || 0)
  })
  const canRenderPerSection =
    sectionKeys.length > 1 && sectionKeys.every(k => (roomsBySection[k] ?? 0) > 0)

  // ---- Optimistic totals ----
  const canOptimizeTotals = !canRenderPerSection && q.adjusted_sqft > 0
  const origLineItemsSum = initialLineItems.reduce((s, li) => s + Number(li.total), 0)
  const currentLineItemsSum = items.reduce((s, li) => s + li.total, 0)

  let displaySubtotal = q.subtotal
  let displayMarkup = q.markup_amount
  let displayTax = q.tax_amount
  let displayFinalTotal = q.final_total
  let displayDeposit = q.deposit_amount

  if (canOptimizeTotals) {
    const origMat = Number(q.material_total) || q.adjusted_sqft * q.material_cost_per_sqft
    const origLab = Number(q.labor_total) || q.adjusted_sqft * q.labor_cost_per_sqft
    const origFixedPortion = q.subtotal - origMat - origLab - origLineItemsSum

    // Delta from fee edits relative to original server values
    const underlaymentRate = extrasJson.underlayment_per_sqft ?? 0
    const feeDelta =
      (removalFee - (q.removal_fee ?? 0)) +
      (furnitureFee - (q.furniture_fee ?? 0)) +
      (stairsFee - (q.stairs_fee ?? 0)) +
      (quarterRoundFee - (q.quarter_round_fee ?? 0)) +
      (reducersFee - (q.reducers_fee ?? 0)) +
      (deliveryFee - (q.delivery_fee ?? 0)) +
      (customFeeAmount - (q.custom_fee_amount ?? 0)) +
      ((extrasJson.subfloor_prep ?? 0) - ((q.extras_json?.subfloor_prep) ?? 0)) +
      ((extrasJson.floor_protection ?? 0) - ((q.extras_json?.floor_protection) ?? 0)) +
      ((extrasJson.disposal_fee ?? 0) - ((q.extras_json?.disposal_fee) ?? 0)) +
      // Underlayment is per-sqft; account for sqft change
      underlaymentRate * (adjustedSqft - q.adjusted_sqft)

    const fixedPortion = origFixedPortion + feeDelta
    const newMat = adjustedSqft * materialRate
    const newLab = adjustedSqft * laborRate
    displaySubtotal = fixedPortion + newMat + newLab + currentLineItemsSum
    displayMarkup = q.markup_pct > 0 ? displaySubtotal * (q.markup_pct / 100) : 0
    const taxBase = displaySubtotal + displayMarkup
    displayTax = q.tax_enabled ? taxBase * (q.tax_pct / 100) : 0
    displayFinalTotal = displaySubtotal + displayMarkup + displayTax
    displayDeposit = q.deposit_pct > 0 ? displayFinalTotal * (q.deposit_pct / 100) : 0
  }

  const showSubtotal = (q.tax_enabled && displayTax > 0) || displayMarkup > 0
  const showDeposit = q.deposit_pct > 0 && displayDeposit > 0
  const remainingBalance = displayFinalTotal - displayDeposit

  // ---- Material row description ----
  const flooringLabel = flooringTypeLabel(q.flooring_type, q.section_flooring_types) || 'flooring'
  const wasteFactor = 1 + (Number(q.waste_pct) || 0) / 100

  // Shared grid columns (4 cols: desc | sqft | rate | total)
  const GRID_COLS = '5fr 80px 90px 90px'

  // Helper: row checkbox for selectable rows
  function RowCheckbox({ rowKey }: { rowKey: string }) {
    if (!selectMode) return null
    return (
      <input
        type="checkbox"
        checked={selectedKeys.has(rowKey)}
        onChange={e => {
          setSelectedKeys(prev => {
            const next = new Set(prev)
            e.target.checked ? next.add(rowKey) : next.delete(rowKey)
            return next
          })
        }}
        className="mr-2 flex-shrink-0"
        style={{ accentColor: '#1d1d1f' }}
        onClick={e => e.stopPropagation()}
      />
    )
  }

  return (
      <div
      className="bg-white rounded-xl p-4 sm:p-6 pb-2 relative"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Top row: company block + Estimate title + meta table */}
      <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 p-3 sm:w-1/2" style={{ border: FRAME_BORDER }}>
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.company_name || 'Company logo'}
              className="w-14 h-14 object-contain flex-shrink-0"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-base font-bold" style={{ color: '#0f172a' }}>
              {settings?.company_name || 'Flooring Company'}
            </p>
            {settings?.phone ? (
              <p className="text-xs mt-0.5" style={{ color: '#334155' }}>T: {settings.phone}</p>
            ) : null}
            {settings?.email ? (
              <p className="text-xs" style={{ color: '#334155' }}>{settings.email}</p>
            ) : null}
            {settings?.website ? (
              <p className="text-xs" style={{ color: '#334155' }}>{settings.website}</p>
            ) : null}
          </div>
        </div>

        <div className="sm:w-1/2 flex flex-col sm:items-end">
          <p className="text-3xl sm:text-4xl italic font-bold mb-2" style={{ color: '#0f172a' }}>
            Estimate
          </p>
          <div className="w-full sm:w-56 text-xs" style={{ border: FRAME_BORDER }}>
            <div className="flex" style={{ borderBottom: FRAME_BORDER }}>
              <span
                className="flex-1 px-2 py-1 text-center"
                style={{ borderRight: FRAME_BORDER, background: BAND_BG }}
              >
                Date
              </span>
              <span className="flex-1 px-2 py-1 text-center">{dateStr}</span>
            </div>
            <div className="flex">
              <span
                className="flex-1 px-2 py-1 text-center"
                style={{ borderRight: FRAME_BORDER, background: BAND_BG }}
              >
                Estimate #
              </span>
              <span className="flex-1 px-2 py-1 text-center">
                <EditableField
                  fieldKey="quote_number"
                  value={quoteNumber}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={handleSave}
                  placeholder="—"
                  textStyle={{ fontSize: 'inherit', color: '#0f172a' }}
                />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer + Job boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div style={{ border: FRAME_BORDER }}>
          <div
            className="px-3 py-1.5 text-sm italic font-bold text-center"
            style={{ background: BAND_BG, color: '#0f172a', borderBottom: FRAME_BORDER }}
          >
            Customer Name
          </div>
          <div className="p-4 min-h-[80px] text-sm" style={{ color: '#0f172a' }}>
            <EditableField
              fieldKey="customer_name"
              value={customerName}
              editing={editing}
              saved={saved}
              onEdit={onEdit}
              onSave={handleSave}
              placeholder="Customer name"
            />
            <EditableField
              fieldKey="customer_phone"
              value={customerPhone}
              editing={editing}
              saved={saved}
              onEdit={onEdit}
              onSave={handleSave}
              placeholder="Phone"
            />
          </div>
        </div>
        <div style={{ border: FRAME_BORDER }}>
          <div
            className="px-3 py-1.5 text-sm italic font-bold text-center"
            style={{ background: BAND_BG, color: '#0f172a', borderBottom: FRAME_BORDER }}
          >
            Job Location
          </div>
          <div className="p-4 min-h-[80px] text-sm" style={{ color: '#0f172a' }}>
            <EditableField
              fieldKey="job_address"
              value={jobAddress}
              editing={editing}
              saved={saved}
              onEdit={onEdit}
              onSave={handleSave}
              multiline
              placeholder="Job address"
              textStyle={{ whiteSpace: 'pre-wrap' }}
            />
          </div>
        </div>
      </div>

      {/* Select toolbar */}
      <div className="flex items-center justify-end mb-1.5">
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            Select
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setSelectMode(false); setSelectedKeys(new Set()) }}
              className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #E5E7EB' }}
            >
              Select all
            </button>
            {selectedKeys.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="text-xs font-medium px-2.5 py-1 rounded-md text-white"
                style={{ background: 'var(--danger)' }}
              >
                Delete ({selectedKeys.size})
              </button>
            )}
            {selectedKeys.size > 0 && (
              <span className="text-xs text-gray-400">{selectedKeys.size} selected</span>
            )}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="text-sm overflow-x-auto">
        <div style={{ minWidth: 480 }}>
          {/* Header */}
          <div
            className="grid items-center px-2 py-1.5 italic font-bold"
            style={{
              gridTemplateColumns: GRID_COLS,
              background: BAND_BG,
              color: '#0f172a',
            }}
          >
            <span>Description</span>
            <span className="text-right">Sqft</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Total</span>
          </div>

          {/* Section pricing rows (static — multi-section not inline-editable) */}
          {canRenderPerSection && sectionPricing &&
            sectionKeys.map(sectionName => {
              const baseSqft = roomsBySection[sectionName] ?? 0
              const adjSqft = baseSqft * wasteFactor
              const sp = sectionPricing[sectionName] || { material: 0, labor: 0 }
              const matRate = Number(sp.material) || 0
              const labRate = Number(sp.labor) || 0
              const sectionType = q.section_flooring_types?.[sectionName]
              const sectionLabel = sectionType
                ? FLOORING_LABEL[sectionType] || sectionType
                : flooringTypeLabel(q.flooring_type, q.section_flooring_types)
              const baseDesc = q.material_description?.trim()
              return (
                <div key={sectionName}>
                  <div
                className="grid items-start px-2 py-2.5"
                style={{
                  gridTemplateColumns: GRID_COLS,
                  borderBottom: ROW_BORDER,
                  color: '#0f172a',
                }}
              >
                <span className="pr-3 break-words whitespace-pre-wrap">
                  {baseDesc ? `${sectionName} — ${baseDesc}` : `${sectionName}: supply ${sectionLabel}`}
                    </span>
                    <span className="text-right tabular-nums">{fmtQty(adjSqft)}</span>
                    <span className="text-right tabular-nums">{fmtNumber(matRate, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(adjSqft * matRate, 2)}</span>
                  </div>
                  {labRate > 0 && (
                    <div
                      className="grid items-start px-2 py-2.5"
                      style={{
                        gridTemplateColumns: GRID_COLS,
                        borderBottom: ROW_BORDER,
                        color: '#0f172a',
                      }}
                    >
                      <span className="pr-3">{sectionName}: labor / installation</span>
                      <span className="text-right tabular-nums">{fmtQty(adjSqft)}</span>
                      <span className="text-right tabular-nums">{fmtNumber(labRate, 2)}</span>
                      <span className="text-right tabular-nums font-semibold">{fmtNumber(adjSqft * labRate, 2)}</span>
                    </div>
                  )}
                </div>
              )
            })
          }

          {/* Simple material + labor rows (editable rate + sqft) */}
          {!canRenderPerSection && q.adjusted_sqft > 0 && (
            <>
              {/* Material row */}
              <div
                className="grid items-start px-2 py-2.5"
                style={{
                  gridTemplateColumns: GRID_COLS,
                  borderBottom: ROW_BORDER,
                  color: '#0f172a',
                  background: selectedKeys.has('row-material') ? 'rgba(0,113,227,0.06)' : undefined,
                }}
              >
                <span className="pr-3 break-words whitespace-pre-wrap flex items-center">
                  <RowCheckbox rowKey="row-material" />
                  <EditableCell
                    fieldKey="material_description"
                    value={materialDescription || `Supply ${flooringLabel}`}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleSave('material_description', val)}
                    align="left"
                  />
                </span>
                <span className="text-right tabular-nums">
                  <EditableCell
                    fieldKey="adjusted_sqft"
                    value={fmtQty(adjustedSqft)}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleSave('adjusted_sqft', val)}
                    align="right"
                  />
                </span>
                <span className="text-right tabular-nums">
                  <EditableCell
                    fieldKey="material_cost_per_sqft"
                    value={fmtNumber(materialRate, 2)}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleSave('material_cost_per_sqft', val)}
                    align="right"
                  />
                </span>
                <span className="text-right tabular-nums font-semibold">
                  {fmtNumber(adjustedSqft * materialRate, 2)}
                  {saved === 'material_cost_per_sqft' && (
                    <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                  )}
                </span>
              </div>

              {/* Labor row (only if rate > 0) */}
              {laborRate > 0 && (
                <div
                  className="grid items-start px-2 py-2.5"
                  style={{
                    gridTemplateColumns: GRID_COLS,
                    borderBottom: ROW_BORDER,
                    color: '#0f172a',
                    background: selectedKeys.has('row-labor') ? 'rgba(0,113,227,0.06)' : undefined,
                  }}
                >
                  <span className="pr-3 flex items-center">
                    <RowCheckbox rowKey="row-labor" />
                    Labor / installation
                  </span>
                  <span className="text-right tabular-nums">{fmtQty(adjustedSqft)}</span>
                  <span className="text-right tabular-nums">
                    <EditableCell
                      fieldKey="labor_cost_per_sqft"
                      value={fmtNumber(laborRate, 2)}
                      editing={editing}
                      saved={saved}
                      onEdit={onEdit}
                      onSave={(key, val) => handleSave('labor_cost_per_sqft', val)}
                      align="right"
                    />
                  </span>
                  <span className="text-right tabular-nums font-semibold">
                    {fmtNumber(adjustedSqft * laborRate, 2)}
                    {saved === 'labor_cost_per_sqft' && (
                      <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                    )}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Line item rows (editable + selectable) */}
          {items.map(li => {
            const liQty = Number(li.qty) || 0
            const liRate = Number(li.unit_price) || 0
            const liTotal = Number(li.total) || liQty * liRate
            const liKey = `li-${li.id}`
            const isSelected = selectedKeys.has(liKey)
            return (
              <div
                key={li.id}
                className="grid items-center px-2 py-2.5"
                style={{
                  gridTemplateColumns: GRID_COLS,
                  borderBottom: ROW_BORDER,
                  color: '#0f172a',
                  background: isSelected ? 'rgba(0,113,227,0.06)' : undefined,
                }}
              >
                <span className="pr-3 break-words flex items-center">
                  <RowCheckbox rowKey={liKey} />
                  <EditableCell
                    fieldKey={`${liKey}-description`}
                    value={li.description?.trim() || ''}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleLineItemSave(li.id, 'description', val)}
                    align="left"
                  />
                </span>
                <span className="text-right tabular-nums">
                  <EditableCell
                    fieldKey={`${liKey}-qty`}
                    value={liQty > 0 ? fmtQty(liQty) : ''}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleLineItemSave(li.id, 'qty', val)}
                    align="right"
                  />
                </span>
                <span className="text-right tabular-nums">
                  <EditableCell
                    fieldKey={`${liKey}-rate`}
                    value={fmtNumber(liRate, 2)}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleLineItemSave(li.id, 'unit_price', val)}
                    align="right"
                  />
                </span>
                <span className="text-right tabular-nums font-semibold">
                  {fmtNumber(liTotal, 2)}
                  {saved === `${liKey}-qty` || saved === `${liKey}-rate` ? (
                    <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                  ) : null}
                </span>
              </div>
            )
          })}

          {/* Fixed fee rows (editable + selectable) */}
          {removalFee > 0 && (
            <div
              className="grid items-center px-2 py-2.5"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-removal') ? 'rgba(0,113,227,0.06)' : undefined }}
            >
              <span className="pr-3 flex items-center">
                <RowCheckbox rowKey="fee-removal" />
                <EditableCell
                  fieldKey="removal_fee_desc"
                  value={removalFeeDesc}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleLocalDescSave(setRemovalFeeDesc, key, val)}
                  align="left"
                />
              </span>
              <span />
              <span className="text-right tabular-nums">
                <EditableCell
                  fieldKey="removal_fee"
                  value={fmtNumber(removalFee, 2)}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('removal_fee', val)}
                  align="right"
                />
              </span>
              <span className="text-right tabular-nums font-semibold">
                {fmtNumber(removalFee, 2)}
                {saved === 'removal_fee' && (
                  <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                )}
              </span>
            </div>
          )}
          {furnitureFee > 0 && (
            <div
              className="grid items-center px-2 py-2.5"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-furniture') ? 'rgba(0,113,227,0.06)' : undefined }}
            >
              <span className="pr-3 flex items-center">
                <RowCheckbox rowKey="fee-furniture" />
                <EditableCell
                  fieldKey="furniture_fee_desc"
                  value={furnitureFeeDesc}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleLocalDescSave(setFurnitureFeeDesc, key, val)}
                  align="left"
                />
              </span>
              <span />
              <span className="text-right tabular-nums">
                <EditableCell
                  fieldKey="furniture_fee"
                  value={fmtNumber(furnitureFee, 2)}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('furniture_fee', val)}
                  align="right"
                />
              </span>
              <span className="text-right tabular-nums font-semibold">
                {fmtNumber(furnitureFee, 2)}
                {saved === 'furniture_fee' && (
                  <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                )}
              </span>
            </div>
          )}
          {stairsFee > 0 && (() => {
            const perUnit = stairCount ? stairsFee / stairCount : stairsFee
            return (
              <div
                className="grid items-center px-2 py-2.5"
                style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-stairs') ? 'rgba(0,113,227,0.06)' : undefined }}
              >
                <span className="pr-3 flex items-center">
                  <RowCheckbox rowKey="fee-stairs" />
                  <EditableCell
                    fieldKey="stairs_fee_desc"
                    value={stairsFeeDesc}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={(key, val) => handleLocalDescSave(setStairsFeeDesc, key, val)}
                    align="left"
                  />
                </span>
                <span className="text-right tabular-nums">{stairCount ? String(stairCount) : ''}</span>
                <span className="text-right tabular-nums">
                  <EditableCell
                    fieldKey="stairs_fee_rate"
                    value={fmtNumber(perUnit, 2)}
                    editing={editing}
                    saved={saved}
                    onEdit={onEdit}
                    onSave={handleStairsRateSave}
                    align="right"
                  />
                </span>
                <span className="text-right tabular-nums font-semibold">
                  {fmtNumber(stairsFee, 2)}
                  {saved === 'stairs_fee_rate' && (
                    <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                  )}
                </span>
              </div>
            )
          })()}
          {quarterRoundFee > 0 && (
            <div
              className="grid items-center px-2 py-2.5"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-quarterround') ? 'rgba(0,113,227,0.06)' : undefined }}
            >
              <span className="pr-3 flex items-center">
                <RowCheckbox rowKey="fee-quarterround" />
                <EditableCell
                  fieldKey="quarter_round_fee_desc"
                  value={quarterRoundFeeDesc}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleLocalDescSave(setQuarterRoundFeeDesc, key, val)}
                  align="left"
                />
              </span>
              <span />
              <span className="text-right tabular-nums">
                <EditableCell
                  fieldKey="quarter_round_fee"
                  value={fmtNumber(quarterRoundFee, 2)}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('quarter_round_fee', val)}
                  align="right"
                />
              </span>
              <span className="text-right tabular-nums font-semibold">
                {fmtNumber(quarterRoundFee, 2)}
                {saved === 'quarter_round_fee' && (
                  <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                )}
              </span>
            </div>
          )}
          {reducersFee > 0 && (
            <div
              className="grid items-center px-2 py-2.5"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-reducers') ? 'rgba(0,113,227,0.06)' : undefined }}
            >
              <span className="pr-3 flex items-center">
                <RowCheckbox rowKey="fee-reducers" />
                <EditableCell
                  fieldKey="reducers_fee_desc"
                  value={reducersFeeDesc}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleLocalDescSave(setReducersFeeDesc, key, val)}
                  align="left"
                />
              </span>
              <span />
              <span className="text-right tabular-nums">
                <EditableCell
                  fieldKey="reducers_fee"
                  value={fmtNumber(reducersFee, 2)}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('reducers_fee', val)}
                  align="right"
                />
              </span>
              <span className="text-right tabular-nums font-semibold">
                {fmtNumber(reducersFee, 2)}
                {saved === 'reducers_fee' && (
                  <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                )}
              </span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div
              className="grid items-center px-2 py-2.5"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-delivery') ? 'rgba(0,113,227,0.06)' : undefined }}
            >
              <span className="pr-3 flex items-center">
                <RowCheckbox rowKey="fee-delivery" />
                <EditableCell
                  fieldKey="delivery_fee_desc"
                  value={deliveryFeeDesc}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleLocalDescSave(setDeliveryFeeDesc, key, val)}
                  align="left"
                />
              </span>
              <span />
              <span className="text-right tabular-nums">
                <EditableCell
                  fieldKey="delivery_fee"
                  value={fmtNumber(deliveryFee, 2)}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('delivery_fee', val)}
                  align="right"
                />
              </span>
              <span className="text-right tabular-nums font-semibold">
                {fmtNumber(deliveryFee, 2)}
                {saved === 'delivery_fee' && (
                  <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                )}
              </span>
            </div>
          )}
          {customFeeAmount > 0 && customFeeLabel.trim() && (
            <div
              className="grid items-center px-2 py-2.5"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-custom') ? 'rgba(0,113,227,0.06)' : undefined }}
            >
              <span className="pr-3 flex items-center">
                <RowCheckbox rowKey="fee-custom" />
                <EditableCell
                  fieldKey="custom_fee_label"
                  value={customFeeLabel.trim()}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('custom_fee_label', val)}
                  align="left"
                />
              </span>
              <span />
              <span className="text-right tabular-nums">
                <EditableCell
                  fieldKey="custom_fee_amount"
                  value={fmtNumber(customFeeAmount, 2)}
                  editing={editing}
                  saved={saved}
                  onEdit={onEdit}
                  onSave={(key, val) => handleSave('custom_fee_amount', val)}
                  align="right"
                />
              </span>
              <span className="text-right tabular-nums font-semibold">
                {fmtNumber(customFeeAmount, 2)}
                {saved === 'custom_fee_amount' && (
                  <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                )}
              </span>
            </div>
          )}

          {/* Extras */}
          {(() => {
            return (
              <>
                {(extrasJson.subfloor_prep ?? 0) > 0 && (
                  <div
                    className="grid items-center px-2 py-2.5"
                    style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-subfloor') ? 'rgba(0,113,227,0.06)' : undefined }}
                  >
                    <span className="pr-3 flex items-center">
                      <RowCheckbox rowKey="fee-subfloor" />
                      <EditableCell
                        fieldKey="extras_subfloor_prep_desc"
                        value={subfloorPrepDesc}
                        editing={editing}
                        saved={saved}
                        onEdit={onEdit}
                        onSave={(key, val) => handleLocalDescSave(setSubfloorPrepDesc, key, val)}
                        align="left"
                      />
                    </span>
                    <span />
                    <span className="text-right tabular-nums">
                      <EditableCell
                        fieldKey="extras_subfloor_prep"
                        value={fmtNumber(extrasJson.subfloor_prep, 2)}
                        editing={editing}
                        saved={saved}
                        onEdit={onEdit}
                        onSave={(key, val) => handleSave('extras_subfloor_prep', val)}
                        align="right"
                      />
                    </span>
                    <span className="text-right tabular-nums font-semibold">
                      {fmtNumber(extrasJson.subfloor_prep, 2)}
                      {saved === 'extras_subfloor_prep' && (
                        <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                      )}
                    </span>
                  </div>
                )}
                {(extrasJson.underlayment_per_sqft ?? 0) > 0 && adjustedSqft > 0 && (
                  <div
                    className="grid items-start px-2 py-2.5"
                    style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-underlayment') ? 'rgba(0,113,227,0.06)' : undefined }}
                  >
                    <span className="pr-3 flex items-center">
                      <RowCheckbox rowKey="fee-underlayment" />
                      <span>Underlayment</span>
                    </span>
                    <span className="text-right tabular-nums">{fmtQty(adjustedSqft)}</span>
                    <span className="text-right tabular-nums">{fmtNumber(extrasJson.underlayment_per_sqft, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(extrasJson.underlayment_per_sqft * adjustedSqft, 2)}</span>
                  </div>
                )}
                {(extrasJson.transition_qty ?? 0) > 0 && (extrasJson.transition_unit ?? 0) > 0 && (
                  <div
                    className="grid items-center px-2 py-2.5"
                    style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-transition') ? 'rgba(0,113,227,0.06)' : undefined }}
                  >
                    <span className="pr-3 flex items-center">
                      <RowCheckbox rowKey="fee-transition" />
                      <span>Transition strips</span>
                    </span>
                    <span className="text-right tabular-nums">{fmtQty(extrasJson.transition_qty)}</span>
                    <span className="text-right tabular-nums">{fmtNumber(extrasJson.transition_unit, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(extrasJson.transition_qty * extrasJson.transition_unit, 2)}</span>
                  </div>
                )}
                {(extrasJson.floor_protection ?? 0) > 0 && (
                  <div
                    className="grid items-center px-2 py-2.5"
                    style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-floorprotection') ? 'rgba(0,113,227,0.06)' : undefined }}
                  >
                    <span className="pr-3 flex items-center">
                      <RowCheckbox rowKey="fee-floorprotection" />
                      <EditableCell
                        fieldKey="extras_floor_protection_desc"
                        value={floorProtectionDesc}
                        editing={editing}
                        saved={saved}
                        onEdit={onEdit}
                        onSave={(key, val) => handleLocalDescSave(setFloorProtectionDesc, key, val)}
                        align="left"
                      />
                    </span>
                    <span />
                    <span className="text-right tabular-nums">
                      <EditableCell
                        fieldKey="extras_floor_protection"
                        value={fmtNumber(extrasJson.floor_protection, 2)}
                        editing={editing}
                        saved={saved}
                        onEdit={onEdit}
                        onSave={(key, val) => handleSave('extras_floor_protection', val)}
                        align="right"
                      />
                    </span>
                    <span className="text-right tabular-nums font-semibold">
                      {fmtNumber(extrasJson.floor_protection, 2)}
                      {saved === 'extras_floor_protection' && (
                        <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                      )}
                    </span>
                  </div>
                )}
                {(extrasJson.disposal_fee ?? 0) > 0 && (
                  <div
                    className="grid items-center px-2 py-2.5"
                    style={{ gridTemplateColumns: GRID_COLS, borderBottom: ROW_BORDER, color: '#0f172a', background: selectedKeys.has('fee-disposal') ? 'rgba(0,113,227,0.06)' : undefined }}
                  >
                    <span className="pr-3 flex items-center">
                      <RowCheckbox rowKey="fee-disposal" />
                      <EditableCell
                        fieldKey="extras_disposal_fee_desc"
                        value={disposalFeeDesc}
                        editing={editing}
                        saved={saved}
                        onEdit={onEdit}
                        onSave={(key, val) => handleLocalDescSave(setDisposalFeeDesc, key, val)}
                        align="left"
                      />
                    </span>
                    <span />
                    <span className="text-right tabular-nums">
                      <EditableCell
                        fieldKey="extras_disposal_fee"
                        value={fmtNumber(extrasJson.disposal_fee, 2)}
                        editing={editing}
                        saved={saved}
                        onEdit={onEdit}
                        onSave={(key, val) => handleSave('extras_disposal_fee', val)}
                        align="right"
                      />
                    </span>
                    <span className="text-right tabular-nums font-semibold">
                      {fmtNumber(extrasJson.disposal_fee, 2)}
                      {saved === 'extras_disposal_fee' && (
                        <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                      )}
                    </span>
                  </div>
                )}
              </>
            )
          })()}

          {/* Add row button — always at bottom of table */}
          <div className="px-2 py-1.5" style={{ borderBottom: ROW_BORDER }}>
            <button
              onClick={addLineItem}
              disabled={addingRow}
              className="flex items-center gap-1.5 text-xs font-medium py-1 px-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {addingRow ? 'Adding…' : 'Add row'}
            </button>
          </div>

          {/* Signature row */}
          <div className="px-2 py-3" style={{ borderBottom: ROW_BORDER, color: '#475569' }}>
            <p className="text-sm font-semibold text-gray-700 mb-2">READ CAREFULLY SIGN &amp; EMAIL BACK</p>
            <div className="flex gap-8 items-end">
              <div className="flex-1">
                <div className="border-b border-gray-700 h-6 mb-1" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">Customer Signature</span>
              </div>
              <div className="w-32">
                <div className="border-b border-gray-700 h-6 mb-1" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">Date</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: scope/notes + totals */}
      <div className="flex flex-col sm:flex-row gap-4 mt-5">
        <div className="flex-1 text-sm" style={{ color: '#0f172a' }}>
          <div className="mb-2">
            <EditableField
              fieldKey="scope_of_work"
              value={scopeOfWork}
              editing={editing}
              saved={saved}
              onEdit={onEdit}
              onSave={handleSave}
              multiline
              placeholder="Add scope of work…"
              textStyle={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
            />
          </div>
          <div className="mb-2">
            <EditableField
              fieldKey="notes"
              value={notesValue}
              editing={editing}
              saved={saved}
              onEdit={onEdit}
              onSave={handleSave}
              multiline
              placeholder="Add notes…"
              textStyle={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
            />
          </div>
          {settings?.payment_terms?.trim() ? (
            <p
              className="text-xs whitespace-pre-wrap leading-relaxed mt-1"
              style={{ color: '#475569' }}
            >
              {settings.payment_terms.trim()}
            </p>
          ) : null}
        </div>

        <div className="sm:w-64 text-sm border-t border-gray-200 pt-3 sm:border-t-0 sm:pt-0" style={{ color: '#0f172a' }}>
          {showSubtotal && (
            <div className="flex justify-between py-0.5">
              <span>Subtotal</span>
              <span>{fmt(displaySubtotal)}</span>
            </div>
          )}
          {q.tax_enabled && displayTax > 0 && (
            <div className="flex justify-between py-0.5">
              <span>Tax ({q.tax_pct}%)</span>
              <span>{fmt(displayTax)}</span>
            </div>
          )}
          {displayMarkup > 0 && (
            <div className="flex justify-between py-0.5">
              <span>Profit ({q.markup_pct}%)</span>
              <span>{fmt(displayMarkup)}</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2 mb-2">
            <span className="text-lg italic font-bold">Total</span>
            <span
              className="text-base font-bold px-3 py-1 min-w-[120px] text-right"
              style={{ border: FRAME_BORDER }}
            >
              {fmt(displayFinalTotal)}
            </span>
          </div>
          {showDeposit && (
            <>
              <div className="flex justify-between py-0.5">
                <span>Deposit Due ({q.deposit_pct}%)</span>
                <span>{fmt(displayDeposit)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Remaining Balance</span>
                <span>{fmt(remainingBalance)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms footer */}
      {terms.length > 0 && (
        <div className="mt-6">
          {terms.map((t, i) => (
            <p key={i} className="text-xs italic font-semibold leading-snug" style={{ color: '#0f172a' }}>
              {t}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
