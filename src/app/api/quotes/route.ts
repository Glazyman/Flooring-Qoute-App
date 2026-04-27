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

  // Check subscription or free trial limit
  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status')
    .eq('id', membership.company_id)
    .single()

  const isSubscribed =
    company?.subscription_status === 'active' ||
    company?.subscription_status === 'trialing'

  if (!isSubscribed) {
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
  }

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

  return NextResponse.json({ id: quote.id })
}
