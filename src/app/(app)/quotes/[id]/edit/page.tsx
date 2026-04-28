import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuoteForm, { QuoteInitialData } from '@/components/QuoteForm'
import type { Quote, QuoteRoom, CompanySettings } from '@/lib/types'
import Link from 'next/link'

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

  const [{ data: quote }, { data: rooms }, { data: company }] = await Promise.all([
    supabase.from('quotes').select('*').eq('id', id).eq('company_id', membership.company_id).single(),
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
    supabase.from('companies').select('default_waste_pct, default_material_cost, default_labor_cost, default_markup_pct, default_deposit_pct').eq('id', membership.company_id).single(),
  ])

  if (!quote) notFound()

  const q = quote as Quote
  const typedRooms = (rooms || []) as QuoteRoom[]

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
    valid_days: q.valid_days,
  }

  const settings: CompanySettings | null = company ? {
    company_id: membership.company_id,
    company_name: '',
    phone: null,
    email: null,
    logo_url: null,
    website: null,
    default_waste_pct: company.default_waste_pct,
    default_material_cost: company.default_material_cost,
    default_labor_cost: company.default_labor_cost,
    default_markup_pct: company.default_markup_pct,
    default_deposit_pct: company.default_deposit_pct,
    default_tax_pct: (company as unknown as { default_tax_pct?: number }).default_tax_pct ?? 0,
  } : null

  const isMeasurement = q.status === 'measurement'

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <Link
          href={isMeasurement ? '/measurements' : `/quotes/${id}`}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-2"
        >
          {isMeasurement ? '← Back to Saved Measurements' : '← Back to Quote'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isMeasurement ? 'Edit Measurement' : 'Edit Quote'}</h1>
        <p className="text-sm text-gray-400 mt-1">{q.customer_name}</p>
      </div>
      <QuoteForm settings={settings} initialData={initialData} quoteId={id} />
    </div>
  )
}
