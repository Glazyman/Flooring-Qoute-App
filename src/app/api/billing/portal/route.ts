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
    .select('company_id, companies!inner(stripe_customer_id)')
    .eq('user_id', user.id)
    .single()

  const customerId = (membership?.companies as unknown as { stripe_customer_id: string | null })
    ?.stripe_customer_id

  if (!customerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard`,
  })

  return NextResponse.json({ url: session.url })
}
