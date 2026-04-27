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

// SVG sparkline from array of values
function Sparkline({ values, color = '#5b72f8' }: { values: number[]; color?: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const w = 120, h = 40
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - (v / max) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-10" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// SVG bar chart for monthly data
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const w = 400, h = 120, barW = 28, gap = (w - data.length * barW) / (data.length + 1)
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = gap + i * (barW + gap)
        const barH = Math.max((d.value / max) * h, d.value > 0 ? 8 : 0)
        const y = h - barH
        const isMax = d.value === max && d.value > 0
        return (
          <g key={i}>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={isMax ? '#818cf8' : '#5a6480'}>
                {d.value}
              </text>
            )}
            <rect
              x={x} y={y} width={barW} height={barH}
              rx="6"
              fill={isMax ? '#5b72f8' : '#1e2238'}
            />
            <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize="9" fill="#5a6480">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    accepted: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Accepted' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Pending' },
    lost: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Lost' },
  }
  const s = map[status] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: status }
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

  // Monthly bar chart data (last 6 months)
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const value = allQuotes.filter(q => {
      const qd = new Date(q.created_at)
      return qd.getMonth() === d.getMonth() && qd.getFullYear() === d.getFullYear()
    }).length
    return { label, value }
  })

  // Sparkline data — daily totals last 7 days
  const sparkline = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return allQuotes.filter(q => {
      const qd = new Date(q.created_at)
      return qd.toDateString() === d.toDateString()
    }).reduce((s, q) => s + (q.final_total || 0), 0)
  })

  const recentQuotes = allQuotes.slice(0, 6)
  const companyName = settingsResult.data?.company_name || 'there'
  const { text: greetText, emoji } = greeting()

  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)' }
  const cardAltStyle = { background: 'var(--card-alt)', border: '1px solid var(--border)' }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            {emoji} {greetText}, {companyName}!
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Overview of your quotes and revenue</p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg"
          style={{ background: 'var(--primary-gradient)', boxShadow: '0 4px 14px rgba(91,114,248,0.4)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Quote
        </Link>
      </div>

      {/* Top row: Revenue card + Monthly analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue gradient card */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--primary-gradient)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide">Total Revenue</p>
              <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">{fmt(totalRevenue)}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold bg-white/20 text-white px-2.5 py-1.5 rounded-full">
              ↑ {winRate}% win
            </span>
          </div>
          <Sparkline values={sparkline.length ? sparkline : [0, 0, 0, 0, 0, 0, 0]} color="rgba(255,255,255,0.8)" />
          <p className="text-xs text-indigo-200 mt-2">Last 7 days activity</p>
        </div>

        {/* Monthly bar chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold" style={{ color: 'var(--text)' }}>Monthly Quotes</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary-light)', color: '#818cf8' }}>
              {total} total
            </span>
          </div>
          <BarChart data={monthlyData} />
        </div>
      </div>

      {/* Bottom row: Stats + Recent quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left stats column */}
        <div className="space-y-4">
          {/* Stat cards */}
          {[
            { label: 'Accepted', value: accepted.length, sub: fmt(acceptedRevenue), color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
            { label: 'Pending', value: pending.length, sub: `${pending.length} open`, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
            { label: 'Lost', value: lost.length, sub: total > 0 ? `${Math.round(lost.length / total * 100)}% lost rate` : '—', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} className="rounded-2xl p-4 flex items-center justify-between" style={cardStyle}>
              <div>
                <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{sub}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: bg }}>
                {label === 'Accepted' ? '✓' : label === 'Pending' ? '⏳' : '✗'}
              </div>
            </div>
          ))}
        </div>

        {/* Recent quotes */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="font-bold" style={{ color: 'var(--text)' }}>Recent Quotes</p>
            <Link href="/quotes" className="text-xs font-semibold" style={{ color: '#818cf8' }}>See all →</Link>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--card-alt)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--text-3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-3)' }}>No quotes yet</p>
              <Link href="/quotes/new" className="text-sm font-semibold" style={{ color: '#818cf8' }}>Create your first quote →</Link>
            </div>
          ) : (
            recentQuotes.map((q, i) => {
              const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const avatarColors = ['#5b72f8', '#7c5cf8', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
              const initials = (q.customer_name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-all"
                  style={{ borderBottom: i < recentQuotes.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: avatarColors[i % avatarColors.length] }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{q.customer_name}</p>
                    <p className="text-xs truncate capitalize" style={{ color: 'var(--text-3)' }}>{q.flooring_type} · {q.job_address || date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmt(q.final_total)}</span>
                    <StatusPill status={q.status} />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
