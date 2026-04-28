import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: allQuotes = [] } = await supabase
    .from('quotes')
    .select('id, status, final_total, created_at, customer_name, job_address, flooring_type')
    .eq('company_id', membership.company_id)
    .neq('status', 'measurement')
    .order('created_at', { ascending: false })

  const quotes = allQuotes ?? []
  const total = quotes.length
  const accepted = quotes.filter(q => q.status === 'accepted')
  const pending  = quotes.filter(q => q.status === 'pending')
  const revenue  = accepted.reduce((s, q) => s + (q.final_total || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95"
          style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* 4 stat tiles */}
      {(() => {
        const avgValue = total > 0 ? revenue / total : 0
        const tiles = [
          { label: 'Total Quotes',    value: String(total),           sub: null },
          { label: 'Accepted',        value: String(accepted.length), sub: `${pending.length} pending` },
          { label: 'Revenue Won',     value: fmt(revenue),            sub: null },
          { label: 'Avg Quote Value', value: fmt(avgValue),           sub: null },
        ]
        return (
          <div className="grid grid-cols-2 gap-3">
            {tiles.map(({ label, value, sub }) => (
              <div key={label} className="bg-white rounded-xl px-5 py-5 overflow-hidden min-w-0" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5 truncate" style={{ color: 'var(--text-3)' }}>{label}</p>
                <p className="text-xl font-extrabold tracking-tight leading-tight truncate" style={{ color: 'var(--text)' }}>{value}</p>
                {sub && <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--text-3)' }}>{sub}</p>}
              </div>
            ))}
          </div>
        )
      })()}

      {/* Recent Quotes */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Recent Quotes</p>
          <Link href="/quotes" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>See all</Link>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>No quotes yet</p>
            <Link href="/quotes/new" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Create your first →</Link>
          </div>
        ) : (
          quotes.slice(0, 8).map((q, i, arr) => {
            const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const initials = (q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            const statusColor: Record<string, string> = { accepted: '#16a34a', pending: '#d97706', lost: '#ff3b30' }
            return (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="quote-row flex items-center gap-3.5 px-5 py-4 active:bg-gray-50"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: '#1c1c1e' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--text-2)' }}>{q.flooring_type} · {q.job_address || date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</p>
                  <p className="text-xs font-medium capitalize" style={{ color: statusColor[q.status] || 'var(--text-3)' }}>{q.status}</p>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
