import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AppNavigation from '@/components/AppNavigation'
import TrialBanner from '@/components/TrialBanner'
import Breadcrumb from '@/components/Breadcrumb'
import GlobalSearch from '@/components/GlobalSearch'

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
  const [companyResult, countResult, settingsResult, pendingResult] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, subscription_status, stripe_price_id')
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
    supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'measurement'),
  ])

  const company = companyResult.data
  if (!company) redirect('/billing/setup')

  const isSubscribed =
    company.subscription_status === 'active' ||
    company.subscription_status === 'trialing'

  const starterPriceIds = new Set([
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  ].filter(Boolean))
  const proPriceIds = new Set([
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ].filter(Boolean))

  const companyPriceId = (company as { stripe_price_id?: string | null }).stripe_price_id ?? null
  const isOnStarter = isSubscribed && companyPriceId !== null && starterPriceIds.has(companyPriceId)
  const isOnPro = isSubscribed && companyPriceId !== null && proPriceIds.has(companyPriceId)

  let freeQuotesRemaining: number | null = null

  if (!isSubscribed) {
    const used = countResult.count ?? 0
    freeQuotesRemaining = Math.max(0, 3 - used)
  }

  // Starter monthly usage (only count when relevant)
  let starterMonthlyUsed: number | null = null
  if (isOnStarter) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', monthStart)
    starterMonthlyUsed = count ?? 0
  }

  const planLabel = isOnPro ? 'Pro' : isOnStarter ? 'Starter' : isSubscribed ? 'Active' : 'Free Trial'
  const trialExhausted = !isSubscribed && (countResult.count ?? 0) >= 3
  const pendingMeasurementCount = pendingResult.count ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppNavigation
        companyName={company.name}
        logoUrl={settingsResult.data?.logo_url ?? null}
        website={settingsResult.data?.website ?? null}
        trialExhausted={trialExhausted}
        planLabel={planLabel}
        pendingMeasurements={pendingMeasurementCount}
      />
      <main className="lg:ml-[216px] pt-14 lg:pt-0 flex flex-col min-h-screen">
        <header
          className="hidden lg:flex sticky top-0 z-30 h-[52px] items-center px-6 gap-4"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(24px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          {/* Breadcrumb — left */}
          <div style={{ flex: 1 }}>
            <Breadcrumb />
          </div>

          {/* Search — center */}
          <GlobalSearch />

          {/* Import pill */}
          <Link
            href="/invoices"
            className="topbar-import"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.05)', color: '#1d1d1f',
              borderRadius: 100, padding: '7px 16px',
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              transition: 'background 0.12s',
            }}
          >
            <Upload size={13} strokeWidth={2} color="#1d1d1f" />
            Import
          </Link>

          {/* New Quote pill */}
          <Link
            href="/quotes/new"
            className="topbar-new-quote"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#1d1d1f', color: 'white',
              borderRadius: 100, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              transition: 'opacity 0.15s',
            }}
          >
            <Plus size={13} strokeWidth={2.5} color="white" />
            New Quote
          </Link>
        </header>
        {freeQuotesRemaining !== null && (
          <TrialBanner remaining={freeQuotesRemaining} />
        )}
        {starterMonthlyUsed !== null && starterMonthlyUsed >= 20 && (
          <div
            className="px-5 py-2.5 text-sm flex items-center justify-between gap-4 text-white"
            style={{ background: starterMonthlyUsed >= 25 ? 'var(--danger)' : 'var(--warning)' }}
          >
            <p className="text-sm">
              <span className="font-medium">
                {starterMonthlyUsed >= 25
                  ? "You've used all 25 quotes this month on Starter."
                  : `Starter plan: ${starterMonthlyUsed}/25 quotes used this month.`}
              </span>{' '}
              <span className="opacity-80">Upgrade to Pro for unlimited quotes.</span>
            </p>
            <a
              href="/billing/setup"
              className="flex-shrink-0 bg-white/20 hover:bg-white/30 font-medium px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap"
            >
              Upgrade →
            </a>
          </div>
        )}
        <div className="flex-1 w-full px-4 py-6 lg:px-8 lg:py-7">{children}</div>
        <footer className="border-t border-gray-100 px-5 lg:px-8 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} FloorQuote Pro</p>
          <div className="flex items-center gap-5">
            <Link href="/help" className="hover:text-gray-600 transition-colors">Help</Link>
            <Link href="/settings" className="hover:text-gray-600 transition-colors">Settings</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
