import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status, stripe_price_id')
    .eq('id', membership.company_id)
    .single()

  const isSubscribed =
    company?.subscription_status === 'active' ||
    company?.subscription_status === 'trialing'

  const starterPriceIds = new Set([
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  ].filter(Boolean))

  const proPriceIds = new Set([
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ].filter(Boolean))

  const companyPriceId = company?.stripe_price_id ?? null
  const isOnStarter = isSubscribed && companyPriceId !== null && starterPriceIds.has(companyPriceId)
  const isOnPro = isSubscribed && companyPriceId !== null && proPriceIds.has(companyPriceId)

  if (!isSubscribed) {
    // Free trial limit check
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)

    if ((count ?? 0) >= 3) redirect('/billing/setup')
  } else if (isOnStarter) {
    // Starter monthly limit check
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)
      .gte('created_at', monthStart)

    if ((count ?? 0) >= 25) {
      return (
        <div className="space-y-5">
          <h1 className="text-base font-semibold text-gray-900">New project</h1>
          <div className="bg-white rounded-xl p-8 text-center max-w-lg mx-auto" style={{ border: '1px solid var(--border)' }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--warning-bg)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Monthly limit reached</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              You&apos;ve used all 25 quotes this month on the Starter plan. Upgrade to Pro for unlimited quotes and AI blueprint scanning.
            </p>
            <Link
              href="/billing/setup"
              className="inline-flex items-center gap-2 text-white text-sm font-medium px-3.5 py-2 rounded-md transition-colors"
              style={{ background: 'var(--button-dark)' }}
            >
              Upgrade to Pro
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      )
    }
  }

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', membership.company_id)
    .single()

  return (
    <div className="space-y-5">
      <h1 className="text-base font-semibold text-gray-900">New project</h1>
      <QuoteForm settings={settings as CompanySettings | null} isPro={!!isOnPro} />
    </div>
  )
}
