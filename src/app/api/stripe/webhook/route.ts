import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  async function updateCompany(customerId: string, updates: Record<string, unknown>) {
    await supabase
      .from('companies')
      .update(updates)
      .eq('stripe_customer_id', customerId)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        await updateCompany(session.customer as string, {
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          current_period_end: sub.cancel_at
            ? new Date(sub.cancel_at * 1000).toISOString()
            : null,
        })
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      await updateCompany(sub.customer as string, {
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        current_period_end: sub.cancel_at
          ? new Date(sub.cancel_at * 1000).toISOString()
          : null,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updateCompany(sub.customer as string, {
        subscription_status: 'canceled',
        stripe_subscription_id: null,
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
