import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuoteForm, { QuoteInitialData } from '@/components/QuoteForm'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'
import { isAdminUser } from '@/lib/admin'

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const [{ data: quote }, { data: rooms }, { data: lineItems }, { data: settingsRow }, { data: company }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).eq('company_id', membership.company_id).single(),
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
    supabase.from('quote_line_items').select('*').eq('quote_id', id).order('position'),
    supabase.from('company_settings').select('*').eq('company_id', membership.company_id).single(),
    supabase.from('companies').select('subscription_status, stripe_price_id').eq('id', membership.company_id).single(),
  ])

  const isAdmin = isAdminUser(user)
  const isSubscribed =
    isAdmin ||
    company?.subscription_status === 'active' ||
    company?.subscription_status === 'trialing'
  const proPriceIds = new Set([
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  ].filter(Boolean))
  const companyPriceId = company?.stripe_price_id ?? null
  const isOnPro = isAdmin || (isSubscribed && companyPriceId !== null && proPriceIds.has(companyPriceId))

  if (!quote) notFound()

  const q = quote as Quote
  const typedRooms = (rooms || []) as QuoteRoom[]
  const typedLineItems = (lineItems || []) as QuoteLineItem[]

  const initialData: QuoteInitialData = {
    customer_name: q.customer_name,
    customer_phone: q.customer_phone,
    customer_email: q.customer_email,
    job_address: q.job_address,
    flooring_type: q.flooring_type,
    section_flooring_types: q.section_flooring_types ?? null,
    section_pricing: (q as unknown as { section_pricing?: Record<string, { material: number; labor: number }> }).section_pricing ?? null,
    measurement_type: q.measurement_type,
    base_sqft: q.base_sqft,
    waste_pct: q.waste_pct,
    rooms: typedRooms.map(r => ({ name: r.name, section: r.section, length: r.length, width: r.width, sqft: r.sqft })),
    material_cost_per_sqft: q.material_cost_per_sqft,
    labor_cost_per_sqft: q.labor_cost_per_sqft,
    removal_fee: q.removal_fee,
    furniture_fee: q.furniture_fee,
    stairs_fee: q.stairs_fee,
    stair_count: q.stair_count,
    delivery_fee: q.delivery_fee,
    quarter_round_fee: q.quarter_round_fee,
    reducers_fee: q.reducers_fee,
    finish_type: q.finish_type,
    wood_species: q.wood_species,
    custom_fee_label: q.custom_fee_label,
    custom_fee_amount: q.custom_fee_amount,
    tax_enabled: q.tax_enabled,
    tax_pct: q.tax_pct,
    markup_pct: q.markup_pct,
    deposit_pct: q.deposit_pct,
    notes: q.notes,
    scope_of_work: q.scope_of_work,
    material_description: q.material_description,
    valid_days: q.valid_days,
    extras_json: q.extras_json ?? null,
    job_options: q.job_options ?? null,
    pricing_mode: q.pricing_mode ?? null,
    room_pricing: q.room_pricing ?? null,
    line_items: typedLineItems.map(li => ({
      description: li.description,
      qty: Number(li.qty) || 0,
      unit_price: Number(li.unit_price) || 0,
      total: Number(li.total) || 0,
    })),
  }

  const settings: CompanySettings | null = (settingsRow as CompanySettings | null) ?? null

  const isMeasurement = q.status === 'measurement'

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-base font-semibold text-gray-900">{isMeasurement ? 'Edit measurement' : q.status === 'draft' ? 'Continue draft' : 'Edit quote'}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{q.customer_name || 'Unnamed draft'}</p>
      </div>
      <QuoteForm settings={settings} initialData={initialData} quoteId={id} initialStatus={q.status} isPro={!!isOnPro} />
    </div>
  )
}
