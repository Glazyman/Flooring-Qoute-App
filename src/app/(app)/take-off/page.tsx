import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TakeOffCalculator from './TakeOffCalculator'

export const dynamic = 'force-dynamic'

export default async function TakeOffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status, stripe_price_id')
    .eq('id', membership.company_id)
    .single()

  const isSubscribed =
    company?.subscription_status === 'active' ||
    company?.subscription_status === 'trialing'

  const proPriceIds = new Set([
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ].filter(Boolean))

  const isOnPro =
    isSubscribed &&
    company?.stripe_price_id != null &&
    proPriceIds.has(company.stripe_price_id)

  return <TakeOffCalculator isPro={!!isOnPro} />
}
