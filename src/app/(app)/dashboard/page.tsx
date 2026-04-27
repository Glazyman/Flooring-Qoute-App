import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'

export const dynamic = 'force-dynamic'


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    accepted: { bg: '#f0fdf4', color: '#16a34a', label: 'Accepted' },
    pending: { bg: '#fffbeb', color: '#d97706', label: 'Pending' },
    lost: { bg: '#fff1f0', color: '#ff3b30', label: 'Lost' },
  }
  const s = map[status] || { bg: '#f2f2f7', color: '#6d6d72', label: status }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const [quotesResult, settingsResult] = await Promise.all([
    supabase.from('quotes')
      .select('id, status, final_total, created_at, customer_name, job_address, flooring_type')
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false }),
    supabase.from('company_settings').select('company_name').eq('company_id', membership.company_id).single(),
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Dashboard
          </h1>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm shadow-md active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Revenue hero card */}
      <div
        className="rounded-3xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #065f46 100%)', boxShadow: '0 8px 32px rgba(13,148,136,0.3)' }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />
        <div className="relative">
          <p className="text-sm font-semibold text-teal-200 mb-1">Total Pipeline</p>
          <p className="text-4xl font-extrabold tracking-tight mb-1">{fmt(totalRevenue)}</p>
          <p className="text-sm text-teal-200">{total} quote{total !== 1 ? 's' : ''} · {winRate}% win rate</p>
          <div className="flex gap-3 mt-4">
            <div className="bg-white/15 rounded-2xl px-3 py-2 flex-1 text-center">
              <p className="text-xl font-bold">{accepted.length}</p>
              <p className="text-xs text-teal-200">Accepted</p>
            </div>
            <div className="bg-white/15 rounded-2xl px-3 py-2 flex-1 text-center">
              <p className="text-xl font-bold">{pending.length}</p>
              <p className="text-xs text-teal-200">Pending</p>
            </div>
            <div className="bg-white/15 rounded-2xl px-3 py-2 flex-1 text-center">
              <p className="text-xl font-bold">{lost.length}</p>
              <p className="text-xs text-teal-200">Lost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Accepted Revenue', value: fmt(acceptedRevenue), icon: '✓', bg: '#f0fdf4', color: '#16a34a', iconBg: '#bbf7d0' },
          { label: 'Pending Jobs', value: String(pending.length), icon: '⏳', bg: '#fffbeb', color: '#d97706', iconBg: '#fde68a' },
        ].map(({ label, value, icon, bg, color, iconBg }) => (
          <div key={label} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${iconBg}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3" style={{ background: iconBg }}>
              {icon}
            </div>
            <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Quotes */}
      <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-bold text-base" style={{ color: 'var(--text)' }}>Recent Quotes</p>
          <Link href="/quotes" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>See all →</Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-gray-500 mb-1">No quotes yet</p>
            <Link href="/quotes/new" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Create your first →</Link>
          </div>
        ) : (
          recentQuotes.map((q, i) => {
            const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const initials = (q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="quote-row flex items-center gap-3.5 px-5 py-3.5 active:bg-gray-50"
                style={{ borderBottom: i < recentQuotes.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                  style={{ background: '#1c1c1e' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--text-2)' }}>{q.flooring_type} · {q.job_address || date}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</span>
                  <StatusBadge status={q.status} />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
