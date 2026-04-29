import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export const maxDuration = 30

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to manage your subscription' }, { status: 401 })
    }

    const { data: membership, error: memberErr } = await supabase
      .from('company_members')
      .select('company_id, companies!inner(stripe_customer_id)')
      .eq('user_id', user.id)
      .single()

    if (memberErr || !membership) {
      return NextResponse.json(
        { error: 'No company found for this user', noCustomer: true },
        { status: 404 }
      )
    }

    const customerId = (membership.companies as unknown as { stripe_customer_id: string | null })
      ?.stripe_customer_id

    if (!customerId) {
      return NextResponse.json(
        { error: 'No active subscription yet. Please subscribe first.', noCustomer: true },
        { status: 404 }
      )
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floorquote.us'

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/dashboard`,
      })
      return NextResponse.json({ url: session.url })
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : 'Stripe portal error'
      console.error('Stripe portal error:', stripeErr)

      // Most common: customer portal not configured in Stripe dashboard
      if (msg.toLowerCase().includes('configuration')) {
        return NextResponse.json(
          {
            error: 'Stripe customer portal is not configured. An admin must enable it at https://dashboard.stripe.com/settings/billing/portal',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: `Stripe error: ${msg}` },
        { status: 500 }
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Billing portal route error:', err)
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 }
    )
  }
}
