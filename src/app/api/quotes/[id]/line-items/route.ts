import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: quoteId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 404 })

  // Verify the quote belongs to this company
  const { data: quote } = await supabase
    .from('quotes')
    .select('id')
    .eq('id', quoteId)
    .eq('company_id', membership.company_id)
    .single()
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { description = '', qty = 0, unit_price = 0, total = 0, position = 0 } = body

  const { data, error } = await supabase
    .from('quote_line_items')
    .insert({ quote_id: quoteId, description, qty, unit_price, total, position })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Failed to insert' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
