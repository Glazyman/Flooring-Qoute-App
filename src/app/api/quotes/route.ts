import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 404 })

  // Check subscription tier and enforce quote limits
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
    // Free trial: 3 quotes total
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Free trial limit reached. Please subscribe to create more quotes.' },
        { status: 403 }
      )
    }
  } else if (isOnStarter) {
    // Starter: 25 quotes per calendar month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)
      .gte('created_at', monthStart)

    if ((count ?? 0) >= 25) {
      return NextResponse.json(
        { error: 'Monthly quote limit reached (25/month on Starter). Upgrade to Pro for unlimited quotes.', upgrade: true },
        { status: 403 }
      )
    }
  }
  // Pro or higher: unlimited — no check needed
  void isOnPro

  const body = await request.json()
  const { rooms, ...quoteData } = body

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({ ...quoteData, company_id: membership.company_id })
    .select()
    .single()

  if (quoteError || !quote) {
    return NextResponse.json({ error: quoteError?.message || 'Failed to save' }, { status: 500 })
  }

  if (rooms && rooms.length > 0) {
    await supabase.from('quote_rooms').insert(
      rooms.map((r: { name: string | null; section: string | null; length: number; width: number; sqft: number }) => ({
        quote_id: quote.id,
        name: r.name,
        section: r.section,
        length: r.length,
        width: r.width,
        sqft: r.sqft,
      }))
    )
  }

  // Auto-save customer to contacts (best-effort, never blocks quote creation)
  try {
    const customerEmail = quoteData.customer_email as string | null | undefined
    const customerName = quoteData.customer_name as string

    let existingQuery = supabase
      .from('customers')
      .select('id')
      .eq('company_id', membership.company_id)

    if (customerEmail) {
      existingQuery = existingQuery.eq('email', customerEmail)
    } else {
      existingQuery = existingQuery.ilike('name', customerName)
    }

    const { data: existing } = await existingQuery.maybeSingle()

    if (!existing) {
      await supabase.from('customers').insert({
        company_id: membership.company_id,
        name: customerName,
        phone: (quoteData.customer_phone as string | null) ?? null,
        email: customerEmail ?? null,
        address: (quoteData.job_address as string | null) ?? null,
      })
    }
  } catch {
    // Non-fatal — quote was already saved successfully
  }

  return NextResponse.json({ id: quote.id })
}
