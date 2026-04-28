import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Check if user already has a company
  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // New OAuth user — auto-create company using their Google display name
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'My'

    const companyName = `${displayName.trim()}'s Company`

    const { data: company } = await service
      .from('companies')
      .insert({ name: companyName, created_by: user.id })
      .select()
      .single()

    if (company) {
      await service.from('company_members').insert({
        company_id: company.id,
        user_id: user.id,
        role: 'owner',
      })
      await service.from('company_settings').insert({
        company_id: company.id,
        company_name: companyName,
        email: user.email,
        default_material_cost: 5.0,
        default_labor_cost: 3.0,
        default_waste_pct: 10.0,
        default_markup_pct: 0.0,
        default_deposit_pct: 50.0,
      })
      await service.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: displayName,
      })
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
