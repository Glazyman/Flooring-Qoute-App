import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCustomerFromQuote } from '@/lib/customerSync'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { rooms, ...quoteData } = body

  const { error } = await supabase
    .from('quotes')
    .update({ ...quoteData })
    .eq('id', id)
    .eq('company_id', membership.company_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Replace rooms: delete existing, insert new
  if (rooms !== undefined) {
    await supabase.from('quote_rooms').delete().eq('quote_id', id)
    if (rooms.length > 0) {
      await supabase.from('quote_rooms').insert(
        rooms.map((r: { name: string | null; section: string | null; length: number; width: number; sqft: number }) => ({
          quote_id: id, name: r.name, section: r.section,
          length: r.length, width: r.width, sqft: r.sqft,
        }))
      )
    }
  }

  if (typeof quoteData.customer_name === 'string' && quoteData.customer_name.trim()) {
    try {
      await syncCustomerFromQuote(supabase, membership.company_id, {
        customer_name: quoteData.customer_name as string | null | undefined,
        customer_phone: quoteData.customer_phone as string | null | undefined,
        customer_email: quoteData.customer_email as string | null | undefined,
        job_address: quoteData.job_address as string | null | undefined,
      })
    } catch {
      // Non-fatal — quote update already succeeded
    }
  }

  return NextResponse.json({ id })
}

export async function DELETE(
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

  // RLS ensures the quote belongs to this company, but double-check
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('company_id', membership.company_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
