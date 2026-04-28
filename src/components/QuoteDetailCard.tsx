'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel, FLOORING_LABEL } from '@/lib/flooringLabels'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'

const BAND_BG = '#94a3b8'
const FRAME_BORDER = '1px solid #0f172a'
const ROW_BORDER = '0.5px solid #e2e8f0'
const HOVER_BG = 'rgba(13,148,136,0.06)'
const TEAL = '#0D9488'

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

  // Line items
  const [items, setItems] = useState<QuoteLineItem[]>(initialLineItems)
  const [addingRow, setAddingRow] = useState(false)

  // Edit/save state
  const [editing, setEditing] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const flashSaved = (key: string) => {
    setSaved(key)
    setTimeout(() => setSaved(s => (s === key ? null : s)), 1500)
  }

  // Save quote field to API
  async function handleSave(field: string, rawValue: string) {
    const numericFields = ['material_cost_per_sqft', 'labor_cost_per_sqft']
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
    }

    setEditing(null)

    fetch(`/api/quotes/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: apiValue }),
    }).then(() => flashSaved(field)).catch(() => {})
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
    const fixedPortion = q.subtotal - origMat - origLab - origLineItemsSum
    const newMat = q.adjusted_sqft * materialRate
    const newLab = q.adjusted_sqft * laborRate
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

  return (
    <div
      className="bg-white rounded-xl p-4 sm:p-6 relative"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Edit shortcut */}
      <Link
        href={`/quotes/${q.id}/edit`}
        className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
        title="Edit this quote"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </Link>

      {/* Top row: company block + Estimate title + meta table */}
      <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 p-3 sm:w-1/2" style={{ border: FRAME_BORDER }}>
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.company_name || 'Company logo'}
              className="w-12 h-12 object-contain flex-shrink-0"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
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
                style={{ borderRight: FRAME_BORDER, background: '#f1f5f9' }}
              >
                Date
              </span>
              <span className="flex-1 px-2 py-1 text-center">{dateStr}</span>
            </div>
            <div className="flex">
              <span
                className="flex-1 px-2 py-1 text-center"
                style={{ borderRight: FRAME_BORDER, background: '#f1f5f9' }}
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
          <div className="p-3 min-h-[64px] text-sm" style={{ color: '#0f172a' }}>
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
          <div className="p-3 min-h-[64px] text-sm" style={{ color: '#0f172a' }}>
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

      {/* Items table */}
      <div className="text-sm overflow-x-auto">
        <div style={{ minWidth: 480 }}>
          <div
            className="grid items-center px-2 py-1.5 italic font-bold"
            style={{
              gridTemplateColumns: '5fr 80px 90px 90px',
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
                    className="grid items-start px-2 py-2"
                    style={{
                      gridTemplateColumns: '5fr 80px 90px 90px',
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
                      className="grid items-start px-2 py-2"
                      style={{
                        gridTemplateColumns: '5fr 80px 90px 90px',
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

          {/* Simple material + labor rows (editable rate) */}
          {!canRenderPerSection && q.adjusted_sqft > 0 && (
            <>
              {/* Material row */}
              <div
                className="grid items-start px-2 py-2"
                style={{
                  gridTemplateColumns: '5fr 80px 90px 90px',
                  borderBottom: ROW_BORDER,
                  color: '#0f172a',
                }}
              >
                <span className="pr-3 break-words whitespace-pre-wrap">
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
                <span className="text-right tabular-nums">{fmtQty(q.adjusted_sqft)}</span>
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
                  {fmtNumber(
                    Number(q.material_total) || q.adjusted_sqft * materialRate,
                    2,
                  )}
                  {saved === 'material_cost_per_sqft' && (
                    <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                  )}
                </span>
              </div>

              {/* Labor row (only if rate > 0) */}
              {laborRate > 0 && (
                <div
                  className="grid items-start px-2 py-2"
                  style={{
                    gridTemplateColumns: '5fr 80px 90px 90px',
                    borderBottom: ROW_BORDER,
                    color: '#0f172a',
                  }}
                >
                  <span className="pr-3">Labor / installation</span>
                  <span className="text-right tabular-nums">{fmtQty(q.adjusted_sqft)}</span>
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
                    {fmtNumber(
                      Number(q.labor_total) || q.adjusted_sqft * laborRate,
                      2,
                    )}
                    {saved === 'labor_cost_per_sqft' && (
                      <span style={{ color: TEAL, marginLeft: 4, fontSize: '0.75em' }}>✓</span>
                    )}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Line item rows (editable) */}
          {items.map(li => {
            const liQty = Number(li.qty) || 0
            const liRate = Number(li.unit_price) || 0
            const liTotal = Number(li.total) || liQty * liRate
            const liKey = `li-${li.id}`
            return (
              <div
                key={li.id}
                className="grid items-start px-2 py-2"
                style={{
                  gridTemplateColumns: '5fr 80px 90px 90px',
                  borderBottom: ROW_BORDER,
                  color: '#0f172a',
                }}
              >
                <span className="pr-3 break-words">
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

          {/* Fixed fee rows (static) */}
          {q.removal_fee > 0 && (
            <div
              className="grid items-start px-2 py-2"
              style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
            >
              <span className="pr-3">Removal of existing flooring</span>
              <span />
              <span className="text-right tabular-nums">{fmtNumber(q.removal_fee, 2)}</span>
              <span className="text-right tabular-nums font-semibold">{fmtNumber(q.removal_fee, 2)}</span>
            </div>
          )}
          {q.furniture_fee > 0 && (
            <div
              className="grid items-start px-2 py-2"
              style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
            >
              <span className="pr-3">Furniture moving</span>
              <span />
              <span className="text-right tabular-nums">{fmtNumber(q.furniture_fee, 2)}</span>
              <span className="text-right tabular-nums font-semibold">{fmtNumber(q.furniture_fee, 2)}</span>
            </div>
          )}
          {q.stairs_fee > 0 && (() => {
            const count = q.stair_count && q.stair_count > 0 ? q.stair_count : null
            const perUnit = count ? q.stairs_fee / count : q.stairs_fee
            return (
              <div
                className="grid items-start px-2 py-2"
                style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
              >
                <span className="pr-3">{count ? `Stairs (${count})` : 'Stairs'}</span>
                <span className="text-right tabular-nums">{count ? String(count) : ''}</span>
                <span className="text-right tabular-nums">{fmtNumber(perUnit, 2)}</span>
                <span className="text-right tabular-nums font-semibold">{fmtNumber(q.stairs_fee, 2)}</span>
              </div>
            )
          })()}
          {q.quarter_round_fee > 0 && (
            <div
              className="grid items-start px-2 py-2"
              style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
            >
              <span className="pr-3">Quarter round / moldings</span>
              <span />
              <span className="text-right tabular-nums">{fmtNumber(q.quarter_round_fee, 2)}</span>
              <span className="text-right tabular-nums font-semibold">{fmtNumber(q.quarter_round_fee, 2)}</span>
            </div>
          )}
          {q.reducers_fee > 0 && (
            <div
              className="grid items-start px-2 py-2"
              style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
            >
              <span className="pr-3">Reducers / saddles</span>
              <span />
              <span className="text-right tabular-nums">{fmtNumber(q.reducers_fee, 2)}</span>
              <span className="text-right tabular-nums font-semibold">{fmtNumber(q.reducers_fee, 2)}</span>
            </div>
          )}
          {q.delivery_fee > 0 && (
            <div
              className="grid items-start px-2 py-2"
              style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
            >
              <span className="pr-3">Delivery</span>
              <span />
              <span className="text-right tabular-nums">{fmtNumber(q.delivery_fee, 2)}</span>
              <span className="text-right tabular-nums font-semibold">{fmtNumber(q.delivery_fee, 2)}</span>
            </div>
          )}
          {q.custom_fee_amount > 0 && q.custom_fee_label?.trim() && (
            <div
              className="grid items-start px-2 py-2"
              style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
            >
              <span className="pr-3">{q.custom_fee_label.trim()}</span>
              <span />
              <span className="text-right tabular-nums">{fmtNumber(q.custom_fee_amount, 2)}</span>
              <span className="text-right tabular-nums font-semibold">{fmtNumber(q.custom_fee_amount, 2)}</span>
            </div>
          )}
          {/* Extras */}
          {(() => {
            const ex = (q.extras_json || {}) as Record<string, number>
            return (
              <>
                {ex.subfloor_prep > 0 && (
                  <div
                    className="grid items-start px-2 py-2"
                    style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
                  >
                    <span className="pr-3">Subfloor prep</span>
                    <span />
                    <span className="text-right tabular-nums">{fmtNumber(ex.subfloor_prep, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(ex.subfloor_prep, 2)}</span>
                  </div>
                )}
                {ex.underlayment_per_sqft > 0 && q.adjusted_sqft > 0 && (
                  <div
                    className="grid items-start px-2 py-2"
                    style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
                  >
                    <span className="pr-3">Underlayment</span>
                    <span className="text-right tabular-nums">{fmtQty(q.adjusted_sqft)}</span>
                    <span className="text-right tabular-nums">{fmtNumber(ex.underlayment_per_sqft, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(ex.underlayment_per_sqft * q.adjusted_sqft, 2)}</span>
                  </div>
                )}
                {ex.transition_qty > 0 && ex.transition_unit > 0 && (
                  <div
                    className="grid items-start px-2 py-2"
                    style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
                  >
                    <span className="pr-3">Transition strips</span>
                    <span className="text-right tabular-nums">{fmtQty(ex.transition_qty)}</span>
                    <span className="text-right tabular-nums">{fmtNumber(ex.transition_unit, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(ex.transition_qty * ex.transition_unit, 2)}</span>
                  </div>
                )}
                {ex.floor_protection > 0 && (
                  <div
                    className="grid items-start px-2 py-2"
                    style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
                  >
                    <span className="pr-3">Floor protection</span>
                    <span />
                    <span className="text-right tabular-nums">{fmtNumber(ex.floor_protection, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(ex.floor_protection, 2)}</span>
                  </div>
                )}
                {ex.disposal_fee > 0 && (
                  <div
                    className="grid items-start px-2 py-2"
                    style={{ gridTemplateColumns: '5fr 80px 90px 90px', borderBottom: ROW_BORDER, color: '#0f172a' }}
                  >
                    <span className="pr-3">Disposal / dump fee</span>
                    <span />
                    <span className="text-right tabular-nums">{fmtNumber(ex.disposal_fee, 2)}</span>
                    <span className="text-right tabular-nums font-semibold">{fmtNumber(ex.disposal_fee, 2)}</span>
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
              className="flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg transition-colors disabled:opacity-50"
              style={{ color: TEAL, background: 'rgba(13,148,136,0.06)' }}
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

        <div className="sm:w-64 text-sm" style={{ color: '#0f172a' }}>
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
