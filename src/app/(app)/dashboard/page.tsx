import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { fmt } from '@/lib/calculations'

export const dynamic = 'force-dynamic'

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accent ? `${accent}15` : '#f0f4ff' }}
        >
          {icon}
        </div>
        {sub && (
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            {sub}
          </span>
        )}
      </div>
      <p
        className="text-2xl font-bold tracking-tight mb-0.5"
        style={{ color: accent || 'var(--text)' }}
      >
        {value}
      </p>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    accepted: { bg: '#f0fdf4', text: '#16a34a', label: 'Accepted' },
    pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
    lost: { bg: '#fef2f2', text: '#dc2626', label: 'Lost' },
  }
  const s = map[status] || { bg: '#f9fafb', text: '#6b7280', label: status }
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

function ProgressBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-semibold text-gray-900">{count}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
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

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, status, final_total, created_at, customer_name, job_address')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  const allQuotes = quotes || []
  const total = allQuotes.length
  const accepted = allQuotes.filter((q) => q.status === 'accepted')
  const pending = allQuotes.filter((q) => q.status === 'pending')
  const lost = allQuotes.filter((q) => q.status === 'lost')

  const totalRevenue = allQuotes.reduce((sum, q) => sum + (q.final_total || 0), 0)
  const acceptedRevenue = accepted.reduce((sum, q) => sum + (q.final_total || 0), 0)
  const winRate = total > 0 ? Math.round((accepted.length / total) * 100) : 0

  const recentQuotes = allQuotes.slice(0, 6)

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateLabel}</p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Quotes"
          value={total}
          sub={total > 0 ? `${winRate}% win rate` : undefined}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          accent="#2563eb"
        />
        <StatCard
          label="Quoted Revenue"
          value={fmt(totalRevenue)}
          sub="pipeline"
          icon={
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accent="#f97316"
        />
        <StatCard
          label="Accepted"
          value={accepted.length}
          sub={fmt(acceptedRevenue)}
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accent="#16a34a"
        />
        <StatCard
          label="Pending"
          value={pending.length}
          icon={
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accent="#d97706"
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="font-semibold text-gray-900 mb-4">Quote Status</p>
          <div className="space-y-4">
            <ProgressBar label="Accepted" count={accepted.length} total={total} color="#16a34a" />
            <ProgressBar label="Pending" count={pending.length} total={total} color="#f59e0b" />
            <ProgressBar label="Lost" count={lost.length} total={total} color="#ef4444" />
          </div>
          {total === 0 && (
            <p className="text-sm text-gray-400 text-center mt-4">No data yet</p>
          )}
        </div>

        {/* Recent quotes */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900">Recent Quotes</p>
            <Link href="/quotes" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              See all →
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-2">No quotes yet</p>
              <Link href="/quotes/new" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Create your first quote →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recentQuotes.map((q) => {
                const date = new Date(q.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {q.customer_name || 'Unnamed Customer'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{q.job_address || date}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-900">{fmt(q.final_total)}</span>
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
