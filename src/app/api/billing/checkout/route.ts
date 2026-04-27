import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

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
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing/setup`,
    metadata: { company_id: company.id },
  })

  return NextResponse.json({ url: session.url })
}
