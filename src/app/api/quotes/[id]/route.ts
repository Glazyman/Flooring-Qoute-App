import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCustomerFromQuote } from '@/lib/customerSync'

// Columns on `public.quotes` that the client may patch directly.
// Anything else in the body is silently dropped — defense-in-depth so a typo
// or malicious field doesn't surface as a Postgres "column does not exist"
// 500 to the user.
const ALLOWED_QUOTE_FIELDS = new Set<string>([
  'customer_name',
  'customer_phone',
  'customer_email',
  'job_address',
  'quote_number',
  'flooring_type',
  'measurement_type',
  'base_sqft',
  'waste_pct',
  'adjusted_sqft',
  'material_cost_per_sqft',
  'labor_cost_per_sqft',
  'removal_fee',
  'furniture_fee',
  'stairs_fee',
  'stair_count',
  'delivery_fee',
  'quarter_round_fee',
  'reducers_fee',
  'finish_type',
  'wood_species',
  'custom_fee_label',
  'custom_fee_amount',
  'tax_enabled',
  'tax_pct',
  'markup_pct',
  'deposit_pct',
  'material_total',
  'labor_total',
  'extras_total',
  'subtotal',
  'tax_amount',
  'markup_amount',
  'final_total',
  'deposit_amount',
  'status',
  'notes',
  'scope_of_work',
  'material_description',
  'valid_days',
  'section_flooring_types',
  'section_pricing',
  'extras_json',
  'job_options',
  'inclusions',
  'exclusions',
  'qualifications',
  'additional_details',
])

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
  const { rooms, line_items, ...rest } = body

  // Whitelist quote columns
  const quoteData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (ALLOWED_QUOTE_FIELDS.has(k)) quoteData[k] = v
  }

  // Only run the update query if there are actual quote fields to update.
  // (Avoids an empty UPDATE when the client only sends `rooms` or `line_items`.)
  if (Object.keys(quoteData).length > 0) {
    const { error } = await supabase
      .from('quotes')
      .update(quoteData)
      .eq('id', id)
      .eq('company_id', membership.company_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

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

  // Replace line items: delete existing, insert new
  if (line_items !== undefined) {
    await supabase.from('quote_line_items').delete().eq('quote_id', id)
    if (Array.isArray(line_items) && line_items.length > 0) {
      await supabase.from('quote_line_items').insert(
        line_items.map((li: { position?: number; description: string | null; qty: number; unit_price: number; total: number }, i: number) => ({
          quote_id: id,
          position: li.position ?? i,
          description: li.description,
          qty: li.qty,
          unit_price: li.unit_price,
          total: li.total,
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
