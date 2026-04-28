import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Invoice } from '@/lib/types'
import InvoicesClient from '@/components/InvoicesClient'

export const dynamic = 'force-dynamic'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  return <InvoicesClient initialInvoices={(invoices ?? []) as Invoice[]} />
}
