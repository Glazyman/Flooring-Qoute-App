import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const maxDuration = 30

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
}): { priceId: string | null; reason?: string } {
  if (body.priceId) {
    return ALLOWED_PRICE_IDS.has(body.priceId)
      ? { priceId: body.priceId }
      : { priceId: null, reason: 'Provided priceId is not allowlisted' }
  }

  if (body.plan && body.billing) {
    if (body.plan === 'starter') {
      const id = body.billing === 'annual'
        ? process.env.STRIPE_STARTER_ANNUAL_PRICE_ID
        : process.env.STRIPE_STARTER_MONTHLY_PRICE_ID
      return id
        ? { priceId: id }
        : { priceId: null, reason: `Missing env var STRIPE_STARTER_${body.billing.toUpperCase()}_PRICE_ID` }
    }
    if (body.plan === 'pro') {
      const id = body.billing === 'annual'
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      return id
        ? { priceId: id }
        : { priceId: null, reason: `Missing env var STRIPE_PRO_${body.billing.toUpperCase()}_PRICE_ID` }
    }
  }

  const legacy = process.env.STRIPE_PRICE_ID
  return legacy
    ? { priceId: legacy }
    : { priceId: null, reason: 'No plan or priceId provided' }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to subscribe' }, { status: 401 })
    }

    const { data: membership, error: memberErr } = await supabase
      .from('company_members')
      .select('company_id, companies!inner(id, name, stripe_customer_id)')
      .eq('user_id', user.id)
      .single()

    if (memberErr || !membership) {
      return NextResponse.json({ error: 'No company found for this account' }, { status: 404 })
    }

    let body: { priceId?: string; plan?: 'starter' | 'pro'; billing?: 'monthly' | 'annual' } = {}
    try {
      body = await request.json()
    } catch {
      // empty body, fall through
    }

    const { priceId, reason } = resolvePriceId(body)

    if (!priceId) {
      return NextResponse.json(
        { error: reason || 'Invalid plan selection' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const company = (membership.companies as unknown) as {
      id: string
      name: string
      stripe_customer_id: string | null
    }
    let customerId = company.stripe_customer_id

    if (!customerId) {
      try {
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
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : 'Stripe customer error'
        console.error('Stripe customer create error:', stripeErr)
        return NextResponse.json(
          { error: `Could not create Stripe customer: ${msg}` },
          { status: 500 }
        )
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floorquote.us'

    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing/setup`,
        metadata: { company_id: company.id },
      })

      if (!session.url) {
        return NextResponse.json(
          { error: 'Stripe did not return a checkout URL' },
          { status: 500 }
        )
      }

      return NextResponse.json({ url: session.url })
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : 'Stripe checkout error'
      console.error('Stripe checkout error:', stripeErr)
      return NextResponse.json(
        { error: `Stripe checkout failed: ${msg}` },
        { status: 500 }
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Billing checkout route error:', err)
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 }
    )
  }
}
