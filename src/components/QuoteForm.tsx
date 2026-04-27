'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { calculateQuote, fmt } from '@/lib/calculations'
import type { CompanySettings, FlooringType, MeasurementType } from '@/lib/types'
import { PlusCircle, Trash2 } from 'lucide-react'

const FLOORING_TYPES: { value: FlooringType; label: string }[] = [
  { value: 'hardwood', label: 'Hardwood' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'tile', label: 'Tile' },
  { value: 'carpet', label: 'Carpet' },
  { value: 'laminate', label: 'Laminate' },
]

interface Room {
  id: string
  name: string
  length: string
  width: string
}

function newRoom(): Room {
  return { id: crypto.randomUUID(), name: '', length: '', width: '' }
}

function n(v: string): number {
  const parsed = parseFloat(v)
  return isNaN(parsed) ? 0 : parsed
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  prefix,
  suffix,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  prefix?: string
  suffix?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
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
          required={required}
          className="flex-1 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none bg-white"
        />
        {suffix && (
          <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-l border-gray-200 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">{title}</h2>
      {children}
    </div>
  )
}

function LineItem({
  label,
  value,
  bold,
  large,
  muted,
}: {
  label: string
  value: number
  bold?: boolean
  large?: boolean
  muted?: boolean
}) {
  return (
    <div className={`flex justify-between ${large ? 'text-base' : 'text-sm'} ${muted ? 'text-gray-400' : 'text-gray-700'}`}>
      <span className={bold || large ? 'font-semibold' : ''}>{label}</span>
      <span className={bold || large ? 'font-bold text-gray-900' : 'font-medium'}>{fmt(value)}</span>
    </div>
  )
}

export default function QuoteForm({ settings }: { settings: CompanySettings | null }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [jobAddress, setJobAddress] = useState('')

  const [flooringType, setFlooringType] = useState<FlooringType>('hardwood')
  const [measurementType, setMeasurementType] = useState<MeasurementType>('manual')
  const [manualSqft, setManualSqft] = useState('')
  const [rooms, setRooms] = useState<Room[]>([newRoom()])
  const [wastePct, setWastePct] = useState(String(settings?.default_waste_pct ?? 10))

  const [materialCost, setMaterialCost] = useState(String(settings?.default_material_cost ?? 5))
  const [laborCost, setLaborCost] = useState(String(settings?.default_labor_cost ?? 3))

  const [removalFee, setRemovalFee] = useState('')
  const [furnitureFee, setFurnitureFee] = useState('')
  const [stairsFee, setStairsFee] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [customFeeLabel, setCustomFeeLabel] = useState('')
  const [customFeeAmount, setCustomFeeAmount] = useState('')

  const [taxEnabled, setTaxEnabled] = useState(false)
  const [taxPct, setTaxPct] = useState('')

  const [markupPct, setMarkupPct] = useState(String(settings?.default_markup_pct ?? 0))
  const [depositPct, setDepositPct] = useState(String(settings?.default_deposit_pct ?? 50))

  const [notes, setNotes] = useState('')
  const [validDays, setValidDays] = useState('30')

  const roomsSqft = rooms.reduce((sum, r) => sum + n(r.length) * n(r.width), 0)
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
    custom_fee_amount: n(customFeeAmount),
    tax_enabled: taxEnabled,
    tax_pct: n(taxPct),
    markup_pct: n(markupPct),
    deposit_pct: n(depositPct),
  })

  function addRoom() {
    setRooms((r) => [...r, newRoom()])
  }

  function removeRoom(id: string) {
    setRooms((r) => r.filter((room) => room.id !== id))
  }

  function updateRoom(id: string, field: keyof Room, value: string) {
    setRooms((r) => r.map((room) => (room.id === id ? { ...room, [field]: value } : room)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) {
      setError('Customer name is required')
      return
    }
    if (baseSqft <= 0) {
      setError('Please enter square footage')
      return
    }

    setSaving(true)
    setError('')

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
      delivery_fee: n(deliveryFee),
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
      status: 'pending',
      notes: notes || null,
      valid_days: n(validDays) || 30,
      rooms:
        measurementType === 'rooms'
          ? rooms
              .filter((r) => n(r.length) > 0 && n(r.width) > 0)
              .map((r) => ({
                name: r.name || null,
                length: n(r.length),
                width: n(r.width),
                sqft: n(r.length) * n(r.width),
              }))
          : [],
    }

    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to save quote')
      setSaving(false)
      return
    }

    router.push(`/quotes/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Customer Info */}
          <Card title="Customer Info">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {FLOORING_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Input label="Waste %" value={wastePct} onChange={setWastePct} type="number" suffix="%" placeholder="10" />
            </div>

            {/* Measurement toggle */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Measurement Method
              </label>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden p-1 bg-gray-50 gap-1">
                <button
                  type="button"
                  onClick={() => setMeasurementType('manual')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    measurementType === 'manual'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Total SqFt
                </button>
                <button
                  type="button"
                  onClick={() => setMeasurementType('rooms')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    measurementType === 'rooms'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  By Rooms
                </button>
              </div>
            </div>

            {measurementType === 'manual' ? (
              <Input label="Total Square Footage" value={manualSqft} onChange={setManualSqft} type="number" suffix="sqft" placeholder="500" />
            ) : (
              <div>
                <div className="space-y-2.5 mb-3">
                  {rooms.map((room, idx) => (
                    <div key={room.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="grid grid-cols-7 gap-2 items-end">
                        <div className="col-span-3">
                          <label className="block text-xs text-gray-400 mb-1">Room Name</label>
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                            placeholder={`Room ${idx + 1}`}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">L</label>
                          <input
                            type="number"
                            value={room.length}
                            onChange={(e) => updateRoom(room.id, 'length', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">W</label>
                          <input
                            type="number"
                            value={room.width}
                            onChange={(e) => updateRoom(room.id, 'width', e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">SqFt</label>
                          <div className="px-2 py-2 rounded-lg border border-gray-100 text-sm bg-gray-100 text-gray-500 text-center">
                            {(n(room.length) * n(room.width)).toFixed(0)}
                          </div>
                        </div>
                        <div className="flex items-end pb-0.5">
                          <button
                            type="button"
                            onClick={() => removeRoom(room.id)}
                            disabled={rooms.length === 1}
                            className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-20 transition-colors rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addRoom}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Room
                </button>
                <p className="text-xs text-gray-400 mt-2">Total: {roomsSqft.toFixed(0)} sqft</p>
              </div>
            )}
          </Card>

          {/* Pricing */}
          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Material Cost / SqFt" value={materialCost} onChange={setMaterialCost} type="number" prefix="$" placeholder="5.00" />
              <Input label="Labor Cost / SqFt" value={laborCost} onChange={setLaborCost} type="number" prefix="$" placeholder="3.00" />
            </div>
          </Card>

          {/* Extras */}
          <Card title="Extras & Add-ons">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Removal Fee" value={removalFee} onChange={setRemovalFee} type="number" prefix="$" placeholder="0" />
              <Input label="Furniture Moving" value={furnitureFee} onChange={setFurnitureFee} type="number" prefix="$" placeholder="0" />
              <Input label="Stairs Fee" value={stairsFee} onChange={setStairsFee} type="number" prefix="$" placeholder="0" />
              <Input label="Delivery Fee" value={deliveryFee} onChange={setDeliveryFee} type="number" prefix="$" placeholder="0" />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <Input label="Custom Fee Label" value={customFeeLabel} onChange={setCustomFeeLabel} placeholder="Other" />
              <Input label="Custom Fee Amount" value={customFeeAmount} onChange={setCustomFeeAmount} type="number" prefix="$" placeholder="0" />
            </div>
          </Card>

          {/* Tax */}
          <Card title="Tax">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setTaxEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${taxEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${taxEnabled ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm font-medium text-gray-700">Apply sales tax</span>
            </div>
            {taxEnabled && (
              <Input label="Tax Rate" value={taxPct} onChange={setTaxPct} type="number" suffix="%" placeholder="8.5" />
            )}
          </Card>

          {/* Markup & Deposit */}
          <Card title="Markup & Deposit">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Markup %" value={markupPct} onChange={setMarkupPct} type="number" suffix="%" placeholder="0" />
              <Input label="Deposit %" value={depositPct} onChange={setDepositPct} type="number" suffix="%" placeholder="50" />
            </div>
          </Card>

          {/* Notes */}
          <Card title="Notes & Validity">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes for the customer…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-300"
                />
              </div>
              <Input label="Valid for (days)" value={validDays} onChange={setValidDays} type="number" placeholder="30" />
            </div>
          </Card>
        </div>

        {/* Right — live totals */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Live Estimate</h2>

              {/* Sqft bar */}
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
                {taxEnabled && calcs.tax_amount > 0 && (
                  <LineItem label={`Tax (${n(taxPct)}%)`} value={calcs.tax_amount} />
                )}
                {calcs.markup_amount > 0 && (
                  <LineItem label={`Markup (${n(markupPct)}%)`} value={calcs.markup_amount} />
                )}
              </div>

              <div className="border-t-2 border-gray-900 mt-3 pt-3">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{fmt(calcs.final_total)}</span>
                </div>
              </div>

              <div className="mt-3 bg-blue-50 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 font-medium">Deposit ({n(depositPct)}%)</span>
                  <span className="font-bold text-blue-700">{fmt(calcs.deposit_amount)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Balance due</span>
                  <span className="font-medium">{fmt(calcs.remaining_balance)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-colors shadow-sm"
            >
              {saving ? 'Saving…' : 'Save Quote →'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
