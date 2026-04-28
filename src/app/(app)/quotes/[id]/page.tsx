import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel, FLOORING_LABEL } from '@/lib/flooringLabels'
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

const BAND_BG = '#94a3b8'
const FRAME_BORDER = '1px solid #0f172a'
const ROW_BORDER = '0.5px solid #e2e8f0'

interface ItemRow {
  description: string
  qty?: string
  rate?: string
  total?: string
}

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

function buildRows(
  q: Quote,
  rooms: QuoteRoom[],
  lineItems: QuoteLineItem[],
): ItemRow[] {
  const rows: ItemRow[] = []
  const sectionPricing =
    (q as unknown as {
      section_pricing?: Record<string, { material: number; labor: number }> | null
    }).section_pricing ?? null

  const sectionKeys = sectionPricing ? Object.keys(sectionPricing) : []
  const roomsBySection: Record<string, number> = {}
  rooms.forEach((r) => {
    const key = r.section || 'Main Floor'
    roomsBySection[key] = (roomsBySection[key] ?? 0) + (Number(r.sqft) || 0)
  })

  const canRenderPerSection =
    sectionKeys.length > 1 &&
    sectionKeys.every((k) => (roomsBySection[k] ?? 0) > 0)

  if (canRenderPerSection && sectionPricing) {
    const wasteFactor = 1 + (Number(q.waste_pct) || 0) / 100
    sectionKeys.forEach((sectionName) => {
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
      // Material row
      rows.push({
        description: baseDesc ? `${sectionName} — ${baseDesc}` : `${sectionName}: supply ${sectionLabel}`,
        qty: fmtQty(adjSqft),
        rate: fmtNumber(matRate, 2),
        total: fmtNumber(adjSqft * matRate, 2),
      })
      // Labor row
      if (labRate > 0) {
        rows.push({
          description: `${sectionName}: labor / installation`,
          qty: fmtQty(adjSqft),
          rate: fmtNumber(labRate, 2),
          total: fmtNumber(adjSqft * labRate, 2),
        })
      }
    })
  } else if (q.adjusted_sqft > 0) {
    const matRate = Number(q.material_cost_per_sqft) || 0
    const labRate = Number(q.labor_cost_per_sqft) || 0
    const flooringLabel =
      flooringTypeLabel(q.flooring_type, q.section_flooring_types) || 'flooring'
    const materialDesc =
      q.material_description?.trim() || `Supply ${flooringLabel}`
    // Material row
    rows.push({
      description: materialDesc,
      qty: fmtQty(q.adjusted_sqft),
      rate: fmtNumber(matRate, 2),
      total: fmtNumber(Number(q.material_total) || q.adjusted_sqft * matRate, 2),
    })
    // Labor row
    if (labRate > 0) {
      rows.push({
        description: 'Labor / installation',
        qty: fmtQty(q.adjusted_sqft),
        rate: fmtNumber(labRate, 2),
        total: fmtNumber(Number(q.labor_total) || q.adjusted_sqft * labRate, 2),
      })
    }
  }

  lineItems.forEach((li) => {
    const qty = Number(li.qty) || 0
    const rate = Number(li.unit_price) || 0
    const total = Number(li.total) || qty * rate
    rows.push({
      description: li.description?.trim() || '—',
      qty: qty > 0 ? fmtQty(qty) : '',
      rate: fmtNumber(rate, 2),
      total: fmtNumber(total, 2),
    })
  })

  if (q.removal_fee > 0) {
    rows.push({
      description: 'Removal of existing flooring',
      rate: fmtNumber(q.removal_fee, 2),
      total: fmtNumber(q.removal_fee, 2),
    })
  }
  if (q.furniture_fee > 0) {
    rows.push({
      description: 'Furniture moving',
      rate: fmtNumber(q.furniture_fee, 2),
      total: fmtNumber(q.furniture_fee, 2),
    })
  }
  if (q.stairs_fee > 0) {
    const count = q.stair_count && q.stair_count > 0 ? q.stair_count : null
    const perUnit = count ? q.stairs_fee / count : q.stairs_fee
    rows.push({
      description: count ? `Stairs (${count})` : 'Stairs',
      qty: count ? String(count) : '',
      rate: fmtNumber(perUnit, 2),
      total: fmtNumber(q.stairs_fee, 2),
    })
  }
  if (q.quarter_round_fee > 0) {
    rows.push({
      description: 'Quarter round / moldings',
      rate: fmtNumber(q.quarter_round_fee, 2),
      total: fmtNumber(q.quarter_round_fee, 2),
    })
  }
  if (q.reducers_fee > 0) {
    rows.push({
      description: 'Reducers / saddles',
      rate: fmtNumber(q.reducers_fee, 2),
      total: fmtNumber(q.reducers_fee, 2),
    })
  }
  if (q.delivery_fee > 0) {
    rows.push({
      description: 'Delivery',
      rate: fmtNumber(q.delivery_fee, 2),
      total: fmtNumber(q.delivery_fee, 2),
    })
  }
  if (q.custom_fee_amount > 0 && q.custom_fee_label?.trim()) {
    rows.push({
      description: q.custom_fee_label.trim(),
      rate: fmtNumber(q.custom_fee_amount, 2),
      total: fmtNumber(q.custom_fee_amount, 2),
    })
  }

  const ex = (q.extras_json || {}) as Record<string, number>
  if (ex.subfloor_prep > 0) {
    rows.push({
      description: 'Subfloor prep',
      rate: fmtNumber(ex.subfloor_prep, 2),
      total: fmtNumber(ex.subfloor_prep, 2),
    })
  }
  if (ex.underlayment_per_sqft > 0 && q.adjusted_sqft > 0) {
    const total = ex.underlayment_per_sqft * q.adjusted_sqft
    rows.push({
      description: 'Underlayment',
      qty: fmtQty(q.adjusted_sqft),
      rate: fmtNumber(ex.underlayment_per_sqft, 2),
      total: fmtNumber(total, 2),
    })
  }
  if (ex.transition_qty > 0 && ex.transition_unit > 0) {
    const total = ex.transition_qty * ex.transition_unit
    rows.push({
      description: 'Transition strips',
      qty: fmtQty(ex.transition_qty),
      rate: fmtNumber(ex.transition_unit, 2),
      total: fmtNumber(total, 2),
    })
  }
  if (ex.floor_protection > 0) {
    rows.push({
      description: 'Floor protection',
      rate: fmtNumber(ex.floor_protection, 2),
      total: fmtNumber(ex.floor_protection, 2),
    })
  }
  if (ex.disposal_fee > 0) {
    rows.push({
      description: 'Disposal / dump fee',
      rate: fmtNumber(ex.disposal_fee, 2),
      total: fmtNumber(ex.disposal_fee, 2),
    })
  }

  return rows
}

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

  const typedRooms = (rooms || []) as QuoteRoom[]
  const typedLineItems = (lineItems || []) as QuoteLineItem[]
  const settings = (settingsRow as CompanySettings | null) ?? null
  const terms = [
    settings?.terms_validity?.trim(),
    settings?.terms_scheduling?.trim(),
    settings?.terms_scope?.trim(),
  ].filter((t): t is string => !!t && t.length > 0)

  const itemRows = buildRows(q, typedRooms, typedLineItems)
  const showSubtotal = (q.tax_enabled && q.tax_amount > 0) || q.markup_amount > 0
  const showDeposit = q.deposit_pct > 0 && q.deposit_amount > 0

  const dateStr = new Date(q.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

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

      {/* Header chrome */}
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
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>{dateStr}</span>
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

      {/* Estimate document — mirrors PDF layout */}
      <div className="bg-white rounded-xl p-4 sm:p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        {/* Top row: company block + Estimate title + meta table */}
        <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-4 mb-5">
          <div
            className="flex items-start gap-3 p-3 sm:w-1/2"
            style={{ border: FRAME_BORDER }}
          >
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
            <p
              className="text-3xl sm:text-4xl italic font-bold mb-2"
              style={{ color: '#0f172a' }}
            >
              Estimate
            </p>
            <div
              className="w-full sm:w-56 text-xs"
              style={{ border: FRAME_BORDER }}
            >
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
                  {q.quote_number || '—'}
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
              <p>{q.customer_name}</p>
              {q.customer_phone ? <p>{q.customer_phone}</p> : null}
              {q.customer_email ? <p className="break-all">{q.customer_email}</p> : null}
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
              <p className="whitespace-pre-wrap">{q.job_address || '—'}</p>
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
            <span className="text-right">Qty</span>
            <span className="text-right">Rate</span>
            <span className="text-right">Total</span>
          </div>
          {itemRows.map((row, i) => (
            <div
              key={i}
              className="grid items-start px-2 py-2"
              style={{
                gridTemplateColumns: '5fr 80px 90px 90px',
                borderBottom: ROW_BORDER,
                color: '#0f172a',
              }}
            >
              <span className="pr-3 break-words whitespace-pre-wrap">{row.description}</span>
              <span className="text-right tabular-nums">{row.qty || ''}</span>
              <span className="text-right tabular-nums">{row.rate || ''}</span>
              <span className="text-right tabular-nums font-semibold">{row.total || ''}</span>
            </div>
          ))}
          {/* Inline signature row */}
          <div
            className="px-2 py-3"
            style={{ borderBottom: ROW_BORDER, color: '#475569' }}
          >
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
          </div>{/* end minWidth wrapper */}
        </div>

        {/* Bottom row: scope/notes + totals */}
        <div className="flex flex-col sm:flex-row gap-4 mt-5">
          <div className="flex-1 text-sm" style={{ color: '#0f172a' }}>
            {q.scope_of_work?.trim() ? (
              <p className="whitespace-pre-wrap leading-relaxed mb-2">{q.scope_of_work.trim()}</p>
            ) : null}
            {q.notes?.trim() ? (
              <p className="whitespace-pre-wrap leading-relaxed mb-2">{q.notes.trim()}</p>
            ) : null}
            {settings?.payment_terms?.trim() ? (
              <p className="text-xs whitespace-pre-wrap leading-relaxed mt-1" style={{ color: '#475569' }}>
                {settings.payment_terms.trim()}
              </p>
            ) : null}
          </div>

          <div className="sm:w-64 text-sm" style={{ color: '#0f172a' }}>
            {showSubtotal && (
              <div className="flex justify-between py-0.5">
                <span>Subtotal</span>
                <span>{fmt(q.subtotal)}</span>
              </div>
            )}
            {q.tax_enabled && q.tax_amount > 0 && (
              <div className="flex justify-between py-0.5">
                <span>Tax ({q.tax_pct}%)</span>
                <span>{fmt(q.tax_amount)}</span>
              </div>
            )}
            {q.markup_amount > 0 && (
              <div className="flex justify-between py-0.5">
                <span>Profit ({q.markup_pct}%)</span>
                <span>{fmt(q.markup_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center mt-2 mb-2">
              <span className="text-lg italic font-bold">Total</span>
              <span
                className="text-base font-bold px-3 py-1 min-w-[120px] text-right"
                style={{ border: FRAME_BORDER }}
              >
                {fmt(q.final_total)}
              </span>
            </div>
            {showDeposit && (
              <>
                <div className="flex justify-between py-0.5">
                  <span>Deposit Due ({q.deposit_pct}%)</span>
                  <span>{fmt(q.deposit_amount)}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Remaining Balance</span>
                  <span>{fmt(remainingBalance)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Italic disclaimer footer */}
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
    </div>
  )
}
