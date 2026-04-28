import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { description, qty, unit_price, total } = body

  const { data: item } = await supabase
    .from('quote_line_items')
    .select('quote_id, quotes!inner(company_id)')
    .eq('id', id)
    .single()

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  const quoteCompanyId = (item.quotes as unknown as { company_id: string }).company_id
  if (!membership || membership.company_id !== quoteCompanyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates: Record<string, unknown> = {}
  if (description !== undefined) updates.description = description
  if (qty !== undefined) updates.qty = qty
  if (unit_price !== undefined) updates.unit_price = unit_price
  if (total !== undefined) updates.total = total

  const { error } = await supabase.from('quote_line_items').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
