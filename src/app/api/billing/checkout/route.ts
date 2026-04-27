import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

const ALLOWED_PRICE_IDS = new Set([
  process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
  process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  process.env.STRIPE_PRICE_ID, // legacy fallback
].filter(Boolean))

function resolvePriceId(body: {
  priceId?: string
  plan?: 'starter' | 'pro'
  billing?: 'monthly' | 'annual'
}): string | null {
  // Explicit priceId wins if it's allowlisted
  if (body.priceId) {
    return ALLOWED_PRICE_IDS.has(body.priceId) ? body.priceId : null
  }

  // Plan + billing resolution
  if (body.plan && body.billing) {
    if (body.plan === 'starter') {
      return body.billing === 'annual'
        ? (process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? null)
        : (process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? null)
    }
    if (body.plan === 'pro') {
      return body.billing === 'annual'
        ? (process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? null)
        : (process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? null)
    }
  }

  // Legacy fallback
  return process.env.STRIPE_PRICE_ID ?? null
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, companies!inner(id, name, stripe_customer_id)')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  let body: { priceId?: string; plan?: 'starter' | 'pro'; billing?: 'monthly' | 'annual' } = {}
  try {
    body = await request.json()
  } catch {
    // Empty body — use legacy fallback
  }

  const priceId = resolvePriceId(body)

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid or missing plan selection' }, { status: 400 })
  }

  const stripe = getStripe()
  const company = (membership.companies as unknown) as { id: string; name: string; stripe_customer_id: string | null }
  let customerId = company.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: company.name,
      metadata: { company_id: company.id },
    })
    customerId = customer.id

    await supabase
      .from('companies')
      .update({ stripe_customer_id: customerId })
      .eq('id', company.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floorquote.us'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing/setup`,
    metadata: { company_id: company.id },
  })

  return NextResponse.json({ url: session.url })
}
