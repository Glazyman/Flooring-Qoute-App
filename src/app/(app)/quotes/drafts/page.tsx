import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel } from '@/lib/flooringLabels'
import { FileEdit, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DraftsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: drafts } = await supabase
    .from('quotes')
    .select('id, customer_name, customer_phone, job_address, flooring_type, section_flooring_types, adjusted_sqft, final_total, created_at')
    .eq('company_id', membership.company_id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  const rows = drafts ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900">Drafts</h1>
        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md text-white transition-colors"
          style={{ background: 'var(--button-dark)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New project
        </Link>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {rows.length === 0 ? (
          <div className="py-20 text-center">
            <FileEdit className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">No drafts yet</p>
            <p className="text-xs text-gray-400">Quotes you start but don&apos;t submit are saved here automatically.</p>
          </div>
        ) : (
          <div>
            {rows.map((q, i) => {
              const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const initials = (q.customer_name || '?').charAt(0).toUpperCase()
              const typeLabel = flooringTypeLabel(q.flooring_type as string, q.section_flooring_types as Record<string, string> | null)
              const isLast = i === rows.length - 1

              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}/edit`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                  style={{ borderBottom: isLast ? 'none' : '1px solid #F5F5F7', textDecoration: 'none' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0"
                    style={{ background: '#F1F1F4' }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {q.customer_name || <span className="text-gray-400 italic">Unnamed</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {[typeLabel, q.job_address].filter(Boolean).join(' · ') || 'No details yet'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-400">{date}</p>
                    {q.adjusted_sqft > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{Math.round(q.adjusted_sqft).toLocaleString()} sqft</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#F1F1F4', color: '#6e6e73' }}
                    >
                      <FileEdit className="w-3 h-3" />
                      Continue
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
