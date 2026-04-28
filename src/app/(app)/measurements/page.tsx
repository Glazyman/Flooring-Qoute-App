import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Quote } from '@/lib/types'
import MeasurementsClient from '@/components/MeasurementsClient'

export const dynamic = 'force-dynamic'

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

  return <MeasurementsClient initialMeasurements={(measurements ?? []) as Quote[]} />
}
