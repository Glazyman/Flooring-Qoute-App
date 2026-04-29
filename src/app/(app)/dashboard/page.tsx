import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel } from '@/lib/flooringLabels'

export const dynamic = 'force-dynamic'

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  accepted: { color: '#10B981', label: 'Accepted' },
  pending:  { color: '#6366F1', label: 'Pending' },
  lost:     { color: '#9CA3AF', label: 'Lost' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: allQuotes = [] } = await supabase
    .from('quotes')
    .select('id, status, final_total, created_at, customer_name, job_address, flooring_type, section_flooring_types')
    .eq('company_id', membership.company_id)
    .neq('status', 'measurement')
    .order('created_at', { ascending: false })

  const quotes = allQuotes ?? []
  const total = quotes.length
  const accepted = quotes.filter(q => q.status === 'accepted')
  const pending  = quotes.filter(q => q.status === 'pending')
  const revenue  = accepted.reduce((s, q) => s + (q.final_total || 0), 0)
  const avgAccepted = accepted.length > 0 ? revenue / accepted.length : 0

  const tiles = [
    { label: 'Total Quotes',       value: String(total),           sub: null as string | null },
    { label: 'Accepted',           value: String(accepted.length), sub: `${pending.length} pending` },
    { label: 'Revenue Won',        value: fmt(revenue),            sub: null },
    { label: 'Avg Accepted Value', value: fmt(avgAccepted),        sub: null },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
        <Link
          href="/quotes/new"
          className="flex items-center gap-1.5 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="w-4 h-4" />
          New Quote
        </Link>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, sub }) => (
          <div
            key={label}
            className="bg-white rounded-xl px-4 py-4"
            style={{ border: '1px solid var(--border)' }}
          >
            <p className="text-xs text-gray-500 mb-1.5 truncate">{label}</p>
            <p className="text-xl font-semibold text-gray-900 tracking-tight truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Recent Estimates */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F1F4' }}
        >
          <p className="text-sm font-semibold text-gray-900">Recent Estimates</p>
          <Link
            href="/quotes"
            className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            See all →
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 mb-2">No quotes yet</p>
            <Link
              href="/quotes/new"
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #E5E7EB' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create your first quote
            </Link>
          </div>
        ) : (
          <div>
            {quotes.slice(0, 8).map((q) => {
              const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const cfg = STATUS_DOT[q.status] || { color: '#9CA3AF', label: q.status }
              const initials = (q.customer_name || '?').charAt(0).toUpperCase()
              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors"
                  style={{ borderBottom: '1px solid #F5F5F7' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                    style={{ background: '#E5E7EB' }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-gray-800 truncate">{q.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {flooringTypeLabel(q.flooring_type, q.section_flooring_types as Record<string, string> | null)}
                      {q.job_address ? ` · ${q.job_address}` : ''}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center text-xs text-gray-500 mr-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                    {date}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(q.final_total)}</p>
                    <span className="text-xs flex items-center gap-1.5 justify-end" style={{ color: cfg.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      {cfg.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
