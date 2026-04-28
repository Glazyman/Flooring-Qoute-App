import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppNavigation from '@/components/AppNavigation'
import TrialBanner from '@/components/TrialBanner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

  // Run company lookup and quote count in parallel
  const companyId = membership.company_id
  const [companyResult, countResult, settingsResult] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, subscription_status')
      .eq('id', companyId)
      .single(),
    supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    supabase
      .from('company_settings')
      .select('logo_url, website')
      .eq('company_id', companyId)
      .single(),
  ])

  const company = companyResult.data
  if (!company) redirect('/billing/setup')

  const isSubscribed =
    company.subscription_status === 'active' ||
    company.subscription_status === 'trialing'

  let freeQuotesRemaining: number | null = null

  if (!isSubscribed) {
    const used = countResult.count ?? 0
    freeQuotesRemaining = Math.max(0, 3 - used)
    // Don't blanket-redirect here — let the user see their dashboard and existing quotes.
    // Only /quotes/new enforces the limit.
  }

  const trialExhausted = !isSubscribed && (countResult.count ?? 0) >= 3

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppNavigation
        companyName={company.name}
        logoUrl={settingsResult.data?.logo_url ?? null}
        website={settingsResult.data?.website ?? null}
        trialExhausted={trialExhausted}
      />
      <main className="lg:ml-60 pt-14 lg:pt-0">
        {freeQuotesRemaining !== null && (
          <TrialBanner remaining={freeQuotesRemaining} />
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
