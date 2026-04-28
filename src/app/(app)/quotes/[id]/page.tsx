import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel } from '@/lib/flooringLabels'
import { formatExpiration } from '@/lib/format'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'
import DuplicateButton from '@/components/DuplicateButton'
import EmailQuoteButton from '@/components/EmailQuoteButton'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  measurement: { bg: '#eff6ff', text: '#1d4ed8', label: 'Measurement' },
  accepted: { bg: '#f0fdf4', text: '#16a34a', label: 'Accepted' },
  pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
  lost: { bg: '#fef2f2', text: '#dc2626', label: 'Lost' },
}

const cardStyle = { border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/billing/setup')

  const [{ data: quote }, { data: rooms }, { data: lineItems }, { data: settingsRow }] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('company_id', membership.company_id)
      .single(),
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
    supabase.from('quote_line_items').select('*').eq('quote_id', id).order('position'),
    supabase.from('company_settings').select('*').eq('company_id', membership.company_id).single(),
  ])

  if (!quote) notFound()

  const q = quote as Quote
  const remainingBalance = q.final_total - q.deposit_amount
  const statusCfg = STATUS_CONFIG[q.status] || { bg: '#f9fafb', text: '#6b7280', label: q.status }
  const expirationLabel = formatExpiration(q.valid_days || 0, new Date(q.created_at))

  const extras = (q.extras_json || {}) as Record<string, number>
  const typedLineItems = (lineItems || []) as QuoteLineItem[]
  const settings = (settingsRow as CompanySettings | null) ?? null
  const terms = [
    settings?.terms_validity?.trim(),
    settings?.terms_scheduling?.trim(),
    settings?.terms_scope?.trim(),
  ].filter((t): t is string => !!t && t.length > 0)

  return (
    <div className="max-w-3xl space-y-5">
      {/* Measurement approval banner */}
      {q.status === 'measurement' && (
        <div className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-blue-800">This is a saved measurement</p>
            <p className="text-xs text-blue-600 mt-0.5">Approve it to move it to Estimates and send to the customer.</p>
          </div>
          <ApproveMeasurementButton quoteId={q.id} />
        </div>
      )}

      {/* Header */}
      <div>
        <Link
          href={q.status === 'measurement' ? '/measurements' : '/quotes'}
          className="text-xs font-medium hover:text-gray-600 mb-2 inline-flex items-center gap-1"
          style={{ color: 'var(--text-3)' }}
        >
          {q.status === 'measurement' ? '← Back to Measurements' : '← Back to Estimates'}
        </Link>
        <div className="mt-1">
          <h1 className="text-xl sm:text-2xl font-bold break-words" style={{ color: 'var(--text)' }}>{q.customer_name}</h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: statusCfg.bg, color: statusCfg.text }}
            >
              {statusCfg.label}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>
              {new Date(q.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            {q.quote_number && (
              <span className="text-sm" style={{ color: 'var(--text-3)' }}>· #{q.quote_number}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4">
          <Link
            href={`/quotes/${id}/edit`}
            className="flex items-center justify-center gap-1.5 font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm active:scale-95 transition-transform focus:outline-none focus:ring-0"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <DuplicateButton quoteId={id} />
          <EmailQuoteButton quoteId={id} customerEmail={q.customer_email} />
          <a
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 text-white font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm active:scale-95"
            style={{ background: 'var(--primary)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
        </div>
      </div>

      {/* Customer & Job */}
      <div className="bg-white rounded-xl p-4 sm:p-5" style={cardStyle}>
        <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--text-3)' }}>Customer & Job</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail label="Name" value={q.customer_name} />
          {q.customer_phone && <Detail label="Phone" value={q.customer_phone} />}
          {q.customer_email && <Detail label="Email" value={q.customer_email} />}
          {q.job_address && <Detail label="Address" value={q.job_address} />}
          <Detail label="Flooring Type" value={flooringTypeLabel(q.flooring_type, q.section_flooring_types)} />
          <Detail label="Valid For" value={`${q.valid_days} days${expirationLabel ? ` · expires ${expirationLabel}` : ''}`} />
        </div>
      </div>

      {/* Measurements */}
      <div className="bg-white rounded-xl p-4 sm:p-5" style={cardStyle}>
        <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--text-3)' }}>Measurements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Detail label="Base SqFt" value={`${q.base_sqft.toLocaleString()} sqft`} />
          <Detail label="Waste" value={`${q.waste_pct}%`} />
          <Detail label="Adjusted SqFt" value={`${q.adjusted_sqft.toLocaleString()} sqft`} accent />
        </div>
        {rooms && rooms.length > 0 && (
          <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Rooms</p>
            {(() => {
              const typedRooms = rooms as QuoteRoom[]
              const sections = Array.from(new Set(typedRooms.map(r => r.section || 'Other')))
              return sections.map(section => (
                <div key={section} className="mb-3">
                  {sections.length > 1 && (
                    <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-2)' }}>{section}</p>
                  )}
                  <div className="space-y-1.5">
                    {typedRooms.filter(r => (r.section || 'Other') === section).map((room, i) => {
                      const lft = Math.floor(room.length)
                      const lin = Math.round((room.length - lft) * 12)
                      const wft = Math.floor(room.width)
                      const win = Math.round((room.width - wft) * 12)
                      const lStr = lin > 0 ? `${lft}'${lin}"` : `${lft}'`
                      const wStr = win > 0 ? `${wft}'${win}"` : `${wft}'`
                      return (
                        <div key={room.id} className="flex flex-col sm:flex-row sm:justify-between text-sm rounded-xl px-3 py-2 gap-0.5" style={{ background: '#f9fafb' }}>
                          <span className="font-medium" style={{ color: 'var(--text)' }}>{room.name || `Room ${i + 1}`}</span>
                          <span className="text-xs sm:self-center" style={{ color: 'var(--text-3)' }}>
                            {lStr} × {wStr} = <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{room.sqft.toFixed(0)} sqft</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            })()}
          </div>
        )}
      </div>

      {/* Estimate Breakdown */}
      <div className="bg-white rounded-xl p-4 sm:p-5" style={cardStyle}>
        <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--text-3)' }}>Estimate Breakdown</h2>
        <div className="space-y-2.5">
          {q.material_description && q.material_description.trim() && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#475569', lineHeight: 1.4 }}>
              {q.material_description.trim()}
            </p>
          )}
          <LineItem
            label={`Material (${q.adjusted_sqft.toFixed(0)} sqft × $${q.material_cost_per_sqft}/sqft)`}
            value={q.material_total}
          />
          <LineItem
            label={`Labor (${q.adjusted_sqft.toFixed(0)} sqft × $${q.labor_cost_per_sqft}/sqft)`}
            value={q.labor_total}
          />
          {q.removal_fee > 0 && <LineItem label="Removal Fee" value={q.removal_fee} />}
          {q.furniture_fee > 0 && <LineItem label="Furniture Moving" value={q.furniture_fee} />}
          {q.stairs_fee > 0 && (
            <LineItem
              label={q.stair_count ? `Stairs (${q.stair_count})` : 'Stairs Fee'}
              value={q.stairs_fee}
            />
          )}
          {q.quarter_round_fee > 0 && <LineItem label="Quarter Round / Moldings" value={q.quarter_round_fee} />}
          {q.reducers_fee > 0 && <LineItem label="Reducers / Saddles" value={q.reducers_fee} />}
          {q.delivery_fee > 0 && <LineItem label="Delivery Fee" value={q.delivery_fee} />}
          {extras.subfloor_prep > 0 && <LineItem label="Subfloor Prep" value={extras.subfloor_prep} />}
          {extras.underlayment_per_sqft > 0 && <LineItem label={`Underlayment (${q.adjusted_sqft.toFixed(0)} sqft × $${extras.underlayment_per_sqft}/sqft)`} value={extras.underlayment_per_sqft * q.adjusted_sqft} />}
          {extras.transition_qty > 0 && extras.transition_unit > 0 && (
            <LineItem label={`Transition Strips (${extras.transition_qty} × $${extras.transition_unit})`} value={extras.transition_qty * extras.transition_unit} />
          )}
          {extras.floor_protection > 0 && <LineItem label="Floor Protection" value={extras.floor_protection} />}
          {extras.disposal_fee > 0 && <LineItem label="Disposal / Dump Fee" value={extras.disposal_fee} />}
          {q.custom_fee_amount > 0 && (
            <LineItem label={q.custom_fee_label || 'Other'} value={q.custom_fee_amount} />
          )}
          {typedLineItems.length > 0 && (
            <div className="pt-3 mt-1">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Additional Line Items</p>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)', background: '#f9fafb', borderBottom: '1px solid var(--border)' }}>
                  <span className="col-span-6 sm:col-span-7">Description</span>
                  <span className="col-span-1 text-right">Qty</span>
                  <span className="col-span-2 text-right">Rate</span>
                  <span className="col-span-3 sm:col-span-2 text-right">Total</span>
                </div>
                {typedLineItems.map(li => {
                  const qty = Number(li.qty) || 0
                  const rate = Number(li.unit_price) || 0
                  const total = Number(li.total) || qty * rate
                  return (
                    <div key={li.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm border-t" style={{ borderColor: 'var(--border)' }}>
                      <span className="col-span-6 sm:col-span-7 break-words" style={{ color: 'var(--text)' }}>{li.description || '—'}</span>
                      <span className="col-span-1 text-right" style={{ color: 'var(--text-2)' }}>{qty}</span>
                      <span className="col-span-2 text-right" style={{ color: 'var(--text-2)' }}>{fmt(rate)}</span>
                      <span className="col-span-3 sm:col-span-2 text-right font-semibold" style={{ color: 'var(--text)' }}>{fmt(total)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {q.scope_of_work && q.scope_of_work.trim() && (
            <div className="rounded-xl px-4 py-3 mt-3" style={{ background: '#fef3c7', borderLeft: '3px solid #d97706' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#92400e' }}>Scope of Work / Exclusions</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: '#0f172a' }}>{q.scope_of_work.trim()}</p>
            </div>
          )}
          <div className="border-t pt-2.5" style={{ borderColor: 'var(--border)' }}>
            <LineItem label="Subtotal" value={q.subtotal} bold />
          </div>
          {q.tax_enabled && q.tax_amount > 0 && (
            <LineItem label={`Tax (${q.tax_pct}%)`} value={q.tax_amount} />
          )}
          {q.markup_amount > 0 && (
            <LineItem label={`Profit (${q.markup_pct}%)`} value={q.markup_amount} />
          )}
          <div className="border-t-2 pt-3 mt-1" style={{ borderColor: 'var(--text)' }}>
            <div className="flex justify-between">
              <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Total</span>
              <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</span>
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 space-y-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-teal-700 font-semibold">Deposit ({q.deposit_pct}%)</span>
              <span className="font-bold text-teal-700">{fmt(q.deposit_amount)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-3)' }}>
              <span>Remaining balance</span>
              <span className="font-semibold" style={{ color: 'var(--text-2)' }}>{fmt(remainingBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {q.notes && (
        <div className="bg-white rounded-xl p-4 sm:p-5" style={cardStyle}>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Notes</h2>
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)' }}>{q.notes}</p>
        </div>
      )}

      {/* Terms & Disclaimers */}
      {terms.length > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-5" style={cardStyle}>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-3)' }}>Terms & Disclaimers</h2>
          <ul className="space-y-2">
            {terms.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                <span aria-hidden="true" style={{ color: 'var(--text-3)' }}>•</span>
                <span className="flex-1">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Signature line (print-style) — customer-only on the customer's copy */}
      <div className="bg-white rounded-xl p-4 sm:p-5" style={cardStyle}>
        <h2 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'var(--text-3)' }}>Signature</h2>
        <div className="sm:max-w-[60%]">
          <SignatureBlock label="Customer Signature" />
        </div>
      </div>
    </div>
  )
}

function SignatureBlock({ label }: { label: string }) {
  return (
    <div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="border-b" style={{ borderColor: 'var(--text)', height: 32 }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: 'var(--text-3)' }}>{label}</p>
        </div>
        <div className="w-24">
          <div className="border-b" style={{ borderColor: 'var(--text)', height: 32 }} />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: 'var(--text-3)' }}>Date</p>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: accent ? 'var(--primary)' : 'var(--text)' }}>{value}</p>
    </div>
  )
}

function LineItem({
  label,
  value,
  bold,
}: {
  label: string
  value: number
  bold?: boolean
}) {
  return (
    <div className={`flex justify-between items-start gap-2 text-sm ${bold ? 'font-semibold' : ''}`} style={{ color: bold ? 'var(--text)' : 'var(--text-2)' }}>
      <span className="min-w-0 break-words">{label}</span>
      <span className="font-semibold flex-shrink-0">{fmt(value)}</span>
    </div>
  )
}
