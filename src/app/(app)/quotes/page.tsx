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
          className="lg:hidden inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl text-white flex-shrink-0"
          style={{ background: 'var(--button-dark)' }}
        >
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      <QuotesTable quotes={(quotes as Quote[]) || []} />
    </div>
  )
}
