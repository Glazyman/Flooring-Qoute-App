import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'
import DuplicateButton from '@/components/DuplicateButton'
import EmailQuoteButton from '@/components/EmailQuoteButton'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'
import QuoteDetailCard from '@/components/QuoteDetailCard'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  measurement: { bg: '#eff6ff', text: '#1d4ed8', label: 'Measurement' },
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

  const [{ data: quote }, { data: rooms }, { data: lineItems }, { data: settingsRow }] =
    await Promise.all([
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
  const statusCfg = STATUS_CONFIG[q.status] || { bg: '#f9fafb', text: '#6b7280', label: q.status }

  const typedRooms = (rooms || []) as QuoteRoom[]
  const typedLineItems = (lineItems || []) as QuoteLineItem[]
  const settings = (settingsRow as CompanySettings | null) ?? null

  const terms = [
    settings?.terms_validity?.trim(),
    settings?.terms_scheduling?.trim(),
    settings?.terms_scope?.trim(),
  ].filter((t): t is string => !!t && t.length > 0)

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
            <p className="text-xs text-blue-600 mt-0.5">
              Approve it to move it to Estimates and send to the customer.
            </p>
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
          <h1
            className="text-xl sm:text-2xl font-bold break-words"
            style={{ color: 'var(--text)' }}
          >
            {q.customer_name}
          </h1>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: statusCfg.bg, color: statusCfg.text }}
            >
              {statusCfg.label}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>
              {dateStr}
            </span>
            {q.quote_number && (
              <span className="text-sm" style={{ color: 'var(--text-3)' }}>
                · #{q.quote_number}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4">
          <Link
            href={`/quotes/${id}/edit`}
            className="flex items-center justify-center gap-1.5 text-white font-semibold px-4 py-3 sm:py-2.5 rounded-2xl text-sm active:scale-95 transition-transform focus:outline-none focus:ring-0"
            style={{ background: 'var(--primary)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Quote
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </a>
        </div>
      </div>

      {/* Inline-edit hint — above the sheet */}
      <p className="text-xs" style={{ color: 'var(--primary)', opacity: 0.7 }}>
        Click any field to edit
      </p>

      {/* Preview card with inline editing */}
      <QuoteDetailCard
        quote={q}
        rooms={typedRooms}
        initialLineItems={typedLineItems}
        settings={settings}
        terms={terms}
        dateStr={dateStr}
      />
    </div>
  )
}
