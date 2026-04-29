import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'
import DuplicateButton from '@/components/DuplicateButton'
import EmailQuoteButton from '@/components/EmailQuoteButton'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'
import QuoteDetailCard from '@/components/QuoteDetailCard'

export const dynamic = 'force-dynamic'

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  measurement: { color: '#3B82F6', label: 'Measurement' },
  accepted: { color: '#10B981', label: 'Accepted' },
  pending: { color: '#6366F1', label: 'Pending' },
  lost: { color: '#EF4444', label: 'Lost' },
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

  const [
    { data: quote },
    { data: rooms },
    { data: lineItems },
    { data: settingsRow },
    { data: emailConnection },
  ] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('company_id', membership.company_id)
      .single(),
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
    supabase.from('quote_line_items').select('*').eq('quote_id', id).order('position'),
    supabase.from('company_settings').select('*').eq('company_id', membership.company_id).single(),
    supabase
      .from('email_connections')
      .select('id')
      .eq('company_id', membership.company_id)
      .maybeSingle(),
  ])

  const emailConnected = !!emailConnection

  if (!quote) notFound()

  const q = quote as Quote
  const statusCfg = STATUS_DOT[q.status] || { color: '#9CA3AF', label: q.status }

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
        <div className="flex items-center justify-between gap-4 bg-white rounded-xl px-4 py-3" style={{ border: '1px solid var(--border)' }}>
          <div>
            <p className="text-sm font-semibold text-gray-900">This is a saved measurement</p>
            <p className="text-xs text-gray-500 mt-0.5">
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
          className="text-xs font-medium text-gray-500 hover:text-gray-900 mb-2 inline-flex items-center gap-1"
        >
          {q.status === 'measurement' ? '← Back to measurements' : '← Back to estimates'}
        </Link>
        <div className="mt-1">
          <h1 className="text-xl font-semibold text-gray-900 break-words">
            {q.customer_name}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs flex items-center gap-1.5" style={{ color: statusCfg.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.color }} />
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-500">
              {dateStr}
            </span>
            {q.quote_number && (
              <span className="text-xs text-gray-500">
                · #{q.quote_number}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href={`/quotes/${id}/edit`}
            className="inline-flex items-center justify-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
            style={{ background: 'var(--button-dark)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit quote
          </Link>
          <DuplicateButton quoteId={id} />
          <EmailQuoteButton quoteId={id} customerEmail={q.customer_email} emailConnected={emailConnected} />
          <a
            href={`/api/quotes/${id}/pdf`}
            target="_blank"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ border: '1px solid #E5E7EB', background: 'white' }}
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

      {/* Inline-edit hint */}
      <p className="text-xs text-gray-400">
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
