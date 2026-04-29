import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel } from '@/lib/flooringLabels'

export const dynamic = 'force-dynamic'

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  accepted: { color: '#30d158', label: 'Accepted' },
  pending:  { color: '#ff9f0a', label: 'Pending' },
  lost:     { color: '#ff453a', label: 'Lost' },
}

const TILE_COLORS = ['#0071e3', '#30d158', '#ff9f0a', '#bf5af2']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase.from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: settings } = await supabase
    .from('company_settings')
    .select('company_name')
    .eq('company_id', membership.company_id)
    .single()

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

  const companyDisplay = settings?.company_name || 'there'

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()

  const tiles = [
    { label: 'TOTAL QUOTES',       value: String(total),           color: TILE_COLORS[0] },
    { label: 'ACCEPTED',           value: String(accepted.length), color: TILE_COLORS[1] },
    { label: 'REVENUE WON',        value: fmt(revenue),            color: TILE_COLORS[2] },
    { label: 'AVG ACCEPTED VALUE', value: fmt(avgAccepted),        color: TILE_COLORS[3] },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Greeting */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
          {dateLabel}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.03em', margin: 0 }}>
          Good morning, {companyDisplay}.
        </h1>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="lg:grid-cols-4">
        {tiles.map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: 'white', borderRadius: 16, padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Corner decoration */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 80, height: 80, borderRadius: '0 16px 0 80px',
              background: `${color}08`,
            }} />
            <p style={{ fontSize: 11.5, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
              {label}
            </p>
            <p style={{ fontSize: 30, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.04em', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Estimates */}
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)',
            background: '#fafafa',
          }}
        >
          <p style={{ fontSize: 13.5, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>Recent Estimates</p>
          <Link
            href="/quotes"
            style={{ fontSize: 12, fontWeight: 500, color: '#aeaeb2', textDecoration: 'none' }}
          >
            See all →
          </Link>
        </div>

        {quotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 13, color: '#6e6e73', marginBottom: 12 }}>No quotes yet</p>
            <Link
              href="/quotes/new"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600, color: 'white',
                background: '#1d1d1f', padding: '7px 14px', borderRadius: 8,
                textDecoration: 'none',
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
              Create your first quote
            </Link>
          </div>
        ) : (
          <div>
            {quotes.slice(0, 8).map((q) => {
              const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const cfg = STATUS_CFG[q.status] || { color: '#aeaeb2', label: q.status }
              const initials = (q.customer_name || '?').charAt(0).toUpperCase()
              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="dashboard-recent-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)',
                    textDecoration: 'none', transition: 'background 0.12s',
                  }}
                >
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: '#6e6e73',
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1d1d1f', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.customer_name}
                    </p>
                    <p style={{ fontSize: 11.5, color: '#aeaeb2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {flooringTypeLabel(q.flooring_type, q.section_flooring_types as Record<string, string> | null)}
                      {q.job_address ? ` · ${q.job_address}` : ''}
                    </p>
                  </div>
                  <div className="hidden sm:flex" style={{ alignItems: 'center', fontSize: 11.5, color: '#aeaeb2', gap: 4, marginRight: 4 }}>
                    <Calendar size={12} color="#aeaeb2" />
                    {date}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f', margin: '0 0 2px' }}>{fmt(q.final_total)}</p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: cfg.color }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
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
