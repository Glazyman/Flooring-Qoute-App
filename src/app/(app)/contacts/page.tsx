import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContactsClient from '@/components/ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/billing/setup')

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', membership.company_id)
    .order('name')

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Contacts</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Saved customer contact book</p>
      </div>
      <ContactsClient initialCustomers={customers ?? []} />
    </div>
  )
}
