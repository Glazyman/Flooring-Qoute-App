import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuoteForm from '@/components/QuoteForm'
import type { CompanySettings } from '@/lib/types'

export default async function NewQuotePage() {
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

  // Enforce free trial limit before loading the form
  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status')
    .eq('id', membership.company_id)
    .single()

  const isSubscribed =
    company?.subscription_status === 'active' ||
    company?.subscription_status === 'trialing'

  if (!isSubscribed) {
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)

    if ((count ?? 0) >= 3) redirect('/billing/setup')
  }

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', membership.company_id)
    .single()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
        <p className="text-sm text-gray-400 mt-0.5">Fill in the details to generate your estimate</p>
      </div>
      <QuoteForm settings={settings as CompanySettings | null} />
    </div>
  )
}
