import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
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
    .neq('status', 'measurement')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900">Estimates</h1>
        <Link
          href="/quotes/new"
          className="lg:hidden inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md text-white flex-shrink-0"
          style={{ background: 'var(--button-dark)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New project
        </Link>
      </div>

      <QuotesTable quotes={(quotes as Quote[]) || []} />
    </div>
  )
}
