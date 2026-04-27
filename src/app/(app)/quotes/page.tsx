import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import QuotesTable from '@/components/QuotesTable'
import type { Quote } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function QuotesPage() {
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
    .select('*')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Quotes</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {quotes?.length || 0} quote{quotes?.length !== 1 ? 's' : ''} total
          </p>
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

      <QuotesTable quotes={(quotes as Quote[]) || []} />
    </div>
  )
}
