import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If we have a session_id, sync the subscription status directly
  // (fallback for when the webhook hasn't fired yet)
  if (session_id) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(session_id)

      if (session.subscription && session.customer) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)

        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        await serviceSupabase
          .from('companies')
          .update({
            stripe_subscription_id: sub.id,
            stripe_customer_id: session.customer as string,
            subscription_status: sub.status,
          })
          .eq('stripe_customer_id', session.customer as string)

        // Also try matching by created_by in case customer wasn't set yet
        const { data: membership } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .single()

        if (membership) {
          await serviceSupabase
            .from('companies')
            .update({
              stripe_subscription_id: sub.id,
              stripe_customer_id: session.customer as string,
              subscription_status: sub.status,
            })
            .eq('id', membership.company_id)
        }
      }
    } catch (e) {
      console.error('Failed to sync subscription on success:', e)
    }
  }

  redirect('/dashboard')
}
