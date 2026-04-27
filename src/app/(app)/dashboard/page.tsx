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

  const [quotesResult] = await Promise.all([
    supabase.from('quotes')
      .select('id, status, final_total, created_at, customer_name, job_address, flooring_type')
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false }),
  ])

  const allQuotes = quotesResult.data || []
  const accepted = allQuotes.filter(q => q.status === 'accepted')
  const pending = allQuotes.filter(q => q.status === 'pending')
  const lost = allQuotes.filter(q => q.status === 'lost')
  const total = allQuotes.length
  const totalRevenue = allQuotes.reduce((s, q) => s + (q.final_total || 0), 0)
  const acceptedRevenue = accepted.reduce((s, q) => s + (q.final_total || 0), 0)
  const winRate = total > 0 ? Math.round((accepted.length / total) * 100) : 0
  const recentQuotes = allQuotes.slice(0, 8)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95"
          style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total pipeline */}
        <div className="col-span-2 bg-white rounded-3xl p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Total Pipeline</p>
          <p className="text-4xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{fmt(totalRevenue)}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{total} quote{total !== 1 ? 's' : ''} · {winRate}% win rate</p>
          <div className="mt-4 h-px" style={{ background: 'var(--border)' }} />
          <div className="grid grid-cols-3 mt-4 gap-0">
            {[
              { label: 'Accepted', value: accepted.length },
              { label: 'Pending',  value: pending.length },
              { label: 'Lost',     value: lost.length },
            ].map(({ label, value }, i) => (
              <div key={label} className={`text-center ${i > 0 ? 'border-l' : ''}`} style={{ borderColor: 'var(--border)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Accepted revenue */}
        <div className="bg-white rounded-3xl p-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Accepted</p>
          <p className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{fmt(acceptedRevenue)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{accepted.length} job{accepted.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-3xl p-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Pending</p>
          <p className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>{pending.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{lost.length} lost</p>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-3xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Recent Quotes</p>
          <Link href="/quotes" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>See all</Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-2)' }}>No quotes yet</p>
            <Link href="/quotes/new" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Create your first →</Link>
          </div>
        ) : (
          recentQuotes.map((q, i) => {
            const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const initials = (q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            const statusLabel: Record<string, string> = { accepted: 'Accepted', pending: 'Pending', lost: 'Lost' }
            const statusColor: Record<string, string> = { accepted: '#16a34a', pending: '#d97706', lost: '#ff3b30' }
            return (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="quote-row flex items-center gap-3.5 px-5 py-3.5 active:bg-gray-50"
                style={{ borderBottom: i < recentQuotes.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold" style={{ background: '#1c1c1e' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--text-2)' }}>{q.flooring_type} · {q.job_address || date}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</span>
                  <span className="text-xs font-medium" style={{ color: statusColor[q.status] || 'var(--text-3)' }}>
                    {statusLabel[q.status] || q.status}
                  </span>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
