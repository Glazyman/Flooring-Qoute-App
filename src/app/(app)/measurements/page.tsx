import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Quote } from '@/lib/types'
import { Ruler, Plus, Pencil } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function MeasurementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: measurements } = await supabase
    .from('quotes')
    .select('*')
    .eq('company_id', membership.company_id)
    .eq('status', 'measurement')
    .order('created_at', { ascending: false })

  const list = (measurements ?? []) as Quote[]

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Saved Measurements</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {list.length} measurement{list.length !== 1 ? 's' : ''} — approve to move to Estimates
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95 flex-shrink-0"
          style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light)' }}>
            <Ruler className="w-7 h-7" style={{ color: 'var(--primary)' }} />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No saved measurements</p>
          <p className="text-sm text-gray-400 mb-5">When you create a new quote, it saves here first.</p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="w-4 h-4" /> Take Measurements
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-2xl px-4 sm:px-5 py-4"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center gap-4">
                <Link href={`/quotes/${m.id}/edit`} className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold hover:opacity-80 transition-opacity" style={{ background: 'var(--primary)' }}>
                  {m.customer_name.charAt(0).toUpperCase()}
                </Link>
                <Link href={`/quotes/${m.id}/edit`} className="flex-1 min-w-0 group">
                  <p className="font-semibold text-sm group-hover:underline" style={{ color: 'var(--text)' }}>
                    {m.customer_name}
                    <Pencil className="w-3 h-3 inline-block ml-1.5 opacity-40 group-hover:opacity-70" />
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    {m.flooring_type} · {m.adjusted_sqft.toFixed(0)} sqft · {fmtDate(m.created_at)}
                    {m.job_address && ` · ${m.job_address}`}
                  </p>
                </Link>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmt(m.final_total)}</p>
                  <ApproveMeasurementButton quoteId={m.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
