import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCustomerFromQuote } from '@/lib/customerSync'

// Columns the client may write at create time. Anything else is dropped so a
// stale field in the form payload doesn't surface as a "column does not exist"
// 500.
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

  // Check subscription tier and enforce quote limits
  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status, stripe_price_id')
    .eq('id', membership.company_id)
    .single()

  const isSubscribed =
    company?.subscription_status === 'active' ||
    company?.subscription_status === 'trialing'

  const starterPriceIds = new Set([
    process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  ].filter(Boolean))

  const proPriceIds = new Set([
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ].filter(Boolean))

  const companyPriceId = company?.stripe_price_id ?? null
  const isOnStarter = isSubscribed && companyPriceId !== null && starterPriceIds.has(companyPriceId)
  const isOnPro = isSubscribed && companyPriceId !== null && proPriceIds.has(companyPriceId)

  if (!isSubscribed) {
    // Free trial: 3 quotes total
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
  } else if (isOnStarter) {
    // Starter: 25 quotes per calendar month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', membership.company_id)
      .gte('created_at', monthStart)

    if ((count ?? 0) >= 25) {
      return NextResponse.json(
        { error: 'Monthly quote limit reached (25/month on Starter). Upgrade to Pro for unlimited quotes.', upgrade: true },
        { status: 403 }
      )
    }
  }
  // Pro or higher: unlimited — no check needed
  void isOnPro

  const body = await request.json()
  const { rooms, line_items, ...rest } = body

  // Whitelist columns
  const quoteData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (ALLOWED_QUOTE_FIELDS.has(k)) quoteData[k] = v
  }

  // Auto-generate quote number from settings prefix + counter when none provided.
  const incomingQuoteNumber = typeof quoteData.quote_number === 'string' ? quoteData.quote_number.trim() : ''
  if (!incomingQuoteNumber) {
    try {
      const { data: settings } = await supabase
        .from('company_settings')
        .select('quote_number_prefix, next_quote_number')
        .eq('company_id', membership.company_id)
        .single()

      const prefix = (settings?.quote_number_prefix ?? '').trim()
      const next = settings?.next_quote_number ?? 1
      quoteData.quote_number = prefix ? `${prefix}-${next}` : String(next)

      await supabase
        .from('company_settings')
        .update({ next_quote_number: next + 1 })
        .eq('company_id', membership.company_id)
    } catch {
      // Non-fatal — fall back to no quote_number rather than blocking the create.
      delete quoteData.quote_number
    }
  } else {
    quoteData.quote_number = incomingQuoteNumber
  }

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

  if (Array.isArray(line_items) && line_items.length > 0) {
    await supabase.from('quote_line_items').insert(
      line_items.map((li: { position?: number; description: string | null; qty: number; unit_price: number; total: number }, i: number) => ({
        quote_id: quote.id,
        position: li.position ?? i,
        description: li.description,
        qty: li.qty,
        unit_price: li.unit_price,
        total: li.total,
      }))
    )
  }

  try {
    await syncCustomerFromQuote(supabase, membership.company_id, {
      customer_name: quoteData.customer_name as string | null | undefined,
      customer_phone: quoteData.customer_phone as string | null | undefined,
      customer_email: quoteData.customer_email as string | null | undefined,
      job_address: quoteData.job_address as string | null | undefined,
    })
  } catch {
    // Non-fatal — quote was already saved successfully
  }

  return NextResponse.json({ id: quote.id })
}
