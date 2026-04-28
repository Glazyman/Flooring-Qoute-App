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

  let { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // Auto-create company for new Google/OAuth sign-ups
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'My'
    const companyName = `${String(displayName).trim()}'s Company`

    const { data: newCompany } = await admin
      .from('companies')
      .insert({ name: companyName, created_by: user.id })
      .select()
      .single()

    if (newCompany) {
      await Promise.all([
        admin.from('company_members').insert({ company_id: newCompany.id, user_id: user.id, role: 'owner' }),
        admin.from('company_settings').insert({
          company_id: newCompany.id,
          company_name: companyName,
          email: user.email ?? '',
          default_material_cost: 5.0,
          default_labor_cost: 3.0,
          default_waste_pct: 10.0,
          default_markup_pct: 0.0,
          default_deposit_pct: 50.0,
        }),
        admin.from('profiles').upsert({ id: user.id, email: user.email, full_name: displayName }),
      ])
      // Re-fetch membership after creation
      const { data: refreshed } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single()
      membership = refreshed
    }

    if (!membership) redirect('/billing/setup')
  }

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
      <main className="lg:ml-56 pt-12 lg:pt-0">
        {freeQuotesRemaining !== null && (
          <TrialBanner remaining={freeQuotesRemaining} />
        )}
        <div className="max-w-5xl mx-auto px-5 py-6 lg:px-8 lg:py-7">{children}</div>
      </main>
    </div>
  )
}
