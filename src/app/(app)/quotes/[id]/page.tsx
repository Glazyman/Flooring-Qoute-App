import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'
import type { Quote, QuoteRoom } from '@/lib/types'
import DuplicateButton from '@/components/DuplicateButton'
import EmailQuoteButton from '@/components/EmailQuoteButton'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  accepted: { bg: '#f0fdf4', text: '#16a34a', label: 'Accepted' },
  pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
  lost: { bg: '#fef2f2', text: '#dc2626', label: 'Lost' },
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

  const [{ data: quote }, { data: rooms }] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('company_id', membership.company_id)
      .single(),
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
  ])

  if (!quote) notFound()

  const q = quote as Quote
  const remainingBalance = q.final_total - q.deposit_amount
  const statusCfg = STATUS_CONFIG[q.status] || { bg: '#f9fafb', text: '#6b7280', label: q.status }

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/quotes"
          className="text-xs font-medium text-gray-400 hover:text-gray-600 mb-2 inline-flex items-center gap-1"
        >
          ← Back to Quotes
        </Link>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{q.customer_name}</h1>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: statusCfg.bg, color: statusCfg.text }}
              >
                {statusCfg.label}
              </span>
              <span className="text-sm text-gray-400">
                {new Date(q.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
          </div>
          {/* Primary action: Edit (desktop only inline) */}
          <Link
            href={`/quotes/${id}/edit`}
            className="hidden sm:flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2 mt-4">
          {/* Edit — mobile only */}
          <Link
            href={`/quotes/${id}/edit`}
            className="sm:hidden flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <DuplicateButton quoteId={id} />
          <EmailQuoteButton quoteId={id} customerEmail={q.customer_email} />
          <a
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            className="flex items-center gap-1.5 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm flex-shrink-0 active:scale-95"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </a>
        </div>
      </div>

      {/* Customer & Job */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Customer & Job</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Detail label="Name" value={q.customer_name} />
          {q.customer_phone && <Detail label="Phone" value={q.customer_phone} />}
          {q.customer_email && <Detail label="Email" value={q.customer_email} />}
          {q.job_address && <Detail label="Address" value={q.job_address} />}
          <Detail label="Flooring Type" value={q.flooring_type.charAt(0).toUpperCase() + q.flooring_type.slice(1)} />
          <Detail label="Valid For" value={`${q.valid_days} days`} />
        </div>
      </div>

      {/* Measurements */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Measurements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <Detail label="Base SqFt" value={`${q.base_sqft.toLocaleString()} sqft`} />
          <Detail label="Waste" value={`${q.waste_pct}%`} />
          <Detail label="Adjusted SqFt" value={`${q.adjusted_sqft.toLocaleString()} sqft`} accent />
        </div>
        {rooms && rooms.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rooms</p>
            {(() => {
              const typedRooms = rooms as QuoteRoom[]
              const sections = Array.from(new Set(typedRooms.map(r => r.section || 'Other')))
              return sections.map(section => (
                <div key={section} className="mb-3">
                  {sections.length > 1 && (
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{section}</p>
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
                        <div key={room.id} className="flex flex-col sm:flex-row sm:justify-between text-sm bg-gray-50 rounded-xl px-3 py-2 gap-0.5">
                          <span className="text-gray-700 font-medium">{room.name || `Room ${i + 1}`}</span>
                          <span className="text-gray-400 text-xs sm:self-center">
                            {lStr} × {wStr} = <span className="font-semibold text-gray-600">{room.sqft.toFixed(0)} sqft</span>
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Estimate Breakdown</h2>
        <div className="space-y-2.5">
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
          {q.stairs_fee > 0 && <LineItem label="Stairs Fee" value={q.stairs_fee} />}
          {q.delivery_fee > 0 && <LineItem label="Delivery Fee" value={q.delivery_fee} />}
          {q.custom_fee_amount > 0 && (
            <LineItem label={q.custom_fee_label || 'Other'} value={q.custom_fee_amount} />
          )}
          <div className="border-t border-gray-100 pt-2.5">
            <LineItem label="Subtotal" value={q.subtotal} bold />
          </div>
          {q.tax_enabled && q.tax_amount > 0 && (
            <LineItem label={`Tax (${q.tax_pct}%)`} value={q.tax_amount} />
          )}
          {q.markup_amount > 0 && (
            <LineItem label={`Markup (${q.markup_pct}%)`} value={q.markup_amount} />
          )}
          <div className="border-t-2 border-gray-900 pt-3 mt-1">
            <div className="flex justify-between">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">{fmt(q.final_total)}</span>
            </div>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 space-y-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-teal-700 font-semibold">Deposit ({q.deposit_pct}%)</span>
              <span className="font-bold text-teal-700">{fmt(q.deposit_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Remaining balance</span>
              <span className="font-semibold text-gray-600">{fmt(remainingBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {q.notes && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.notes}</p>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${accent ? 'text-teal-600' : 'text-gray-900'}`}>{value}</p>
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
    <div className={`flex justify-between items-start gap-2 text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
      <span className="min-w-0 break-words">{label}</span>
      <span className="font-semibold flex-shrink-0">{fmt(value)}</span>
    </div>
  )
}
