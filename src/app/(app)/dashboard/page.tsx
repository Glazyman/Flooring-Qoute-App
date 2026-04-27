import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' }
  if (h < 17) return { text: 'Good Afternoon', emoji: '👋' }
  return { text: 'Good Evening', emoji: '🌙' }
}

function StatCard({
  label,
  value,
  sub,
  subPositive,
  icon,
  color,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  subPositive?: boolean
  icon: React.ReactNode
  color: string
  href?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          {icon}
        </div>
        {sub && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              background: subPositive !== false ? '#f0fdf4' : '#fef2f2',
              color: subPositive !== false ? '#16a34a' : '#dc2626',
            }}
          >
            {subPositive !== false ? '↑' : '↓'} {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight mb-0.5">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        {href && (
          <Link
            href={href}
            className="text-xs font-semibold transition-colors"
            style={{ color }}
          >
            See details →
          </Link>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    accepted: { bg: '#f0fdf4', text: '#16a34a', label: 'Accepted' },
    pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
    lost: { bg: '#fef2f2', text: '#dc2626', label: 'Lost' },
  }
  const s = map[status] || { bg: '#f8fafc', text: '#64748b', label: status }
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/billing/setup')

  const [quotesResult, settingsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, status, final_total, created_at, customer_name, job_address, flooring_type')
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('company_settings')
      .select('company_name')
      .eq('company_id', membership.company_id)
      .single(),
  ])

  const allQuotes = quotesResult.data || []
  const total = allQuotes.length
  const accepted = allQuotes.filter((q) => q.status === 'accepted')
  const pending = allQuotes.filter((q) => q.status === 'pending')
  const lost = allQuotes.filter((q) => q.status === 'lost')
  const totalRevenue = allQuotes.reduce((sum, q) => sum + (q.final_total || 0), 0)
  const acceptedRevenue = accepted.reduce((sum, q) => sum + (q.final_total || 0), 0)
  const winRate = total > 0 ? Math.round((accepted.length / total) * 100) : 0
  const recentQuotes = allQuotes.slice(0, 8)

  const companyName = settingsResult.data?.company_name || 'there'
  const { text: greetText, emoji } = greeting()

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {emoji} {greetText}, {companyName}!
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Overview of your quotes and revenue pipeline
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
          style={{ background: 'var(--primary)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          + Create new
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Quotes"
          value={total}
          sub={total > 0 ? `${winRate}% win rate` : undefined}
          subPositive={winRate >= 50}
          icon={<svg className="w-5 h-5" style={{ color: '#0d9488' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          color="#0d9488"
          href="/quotes"
        />
        <StatCard
          label="Total Pipeline"
          value={fmt(totalRevenue)}
          sub={total > 0 ? 'all quotes' : undefined}
          icon={<svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="#7c3aed"
          href="/quotes"
        />
        <StatCard
          label="Accepted"
          value={accepted.length}
          sub={fmt(acceptedRevenue)}
          subPositive={true}
          icon={<svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="#16a34a"
          href="/quotes"
        />
        <StatCard
          label="Pending"
          value={pending.length}
          sub={lost.length > 0 ? `${lost.length} lost` : undefined}
          subPositive={false}
          icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="#d97706"
          href="/quotes"
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="font-bold text-slate-800 mb-5">Quote Breakdown</p>
          {total === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Accepted', count: accepted.length, color: '#16a34a', bg: '#f0fdf4', text: '#16a34a' },
                { label: 'Pending', count: pending.length, color: '#f59e0b', bg: '#fffbeb', text: '#d97706' },
                { label: 'Lost', count: lost.length, color: '#ef4444', bg: '#fef2f2', text: '#dc2626' },
              ].map(({ label, count, color, bg, text }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">{label}</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: bg, color: text }}>{count}</span>
                      </div>
                      <span className="text-xs text-slate-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent quotes list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
            <p className="font-bold text-slate-800">Recent Quotes</p>
            <Link href="/quotes" className="text-xs font-semibold transition-colors" style={{ color: 'var(--primary)' }}>
              See all →
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 mb-2">No quotes yet</p>
              <Link href="/quotes/new" className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Create your first quote →
              </Link>
            </div>
          ) : (
            <div>
              {recentQuotes.map((q, i) => {
                const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const initials = (q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                const colors = ['#0d9488', '#7c3aed', '#2563eb', '#d97706', '#dc2626', '#16a34a']
                const bg = colors[i % colors.length]
                return (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ background: bg }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{q.customer_name}</p>
                      <p className="text-xs text-slate-400 truncate capitalize">{q.flooring_type} · {q.job_address || date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-slate-800">{fmt(q.final_total)}</span>
                      <StatusBadge status={q.status} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
