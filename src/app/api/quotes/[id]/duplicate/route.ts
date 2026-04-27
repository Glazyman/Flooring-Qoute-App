import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: original, error: fetchError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .single()

  if (fetchError || !original) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = original

  const { data: newQuote, error: insertError } = await supabase
    .from('quotes')
    .insert({
      ...rest,
      customer_name: `${original.customer_name} (Copy)`,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !newQuote) {
    return NextResponse.json({ error: insertError?.message || 'Failed to duplicate' }, { status: 500 })
  }

  const { data: originalRooms } = await supabase
    .from('quote_rooms')
    .select('*')
    .eq('quote_id', id)

  if (originalRooms && originalRooms.length > 0) {
    const newRooms = originalRooms.map(({ id: _rid, quote_id: _qid, ...roomRest }) => ({
      ...roomRest,
      quote_id: newQuote.id,
    }))
    await supabase.from('quote_rooms').insert(newRooms)
  }

  return NextResponse.json({ id: newQuote.id })
}
