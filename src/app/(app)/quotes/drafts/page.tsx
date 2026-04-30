import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DraftsClient from '@/components/DraftsClient'

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

  return <DraftsClient initialDrafts={drafts ?? []} />
}
