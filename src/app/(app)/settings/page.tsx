import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'
import type { CompanySettings } from '@/lib/types'

const DEFAULT_SETTINGS: CompanySettings = {
  company_id: '',
  company_name: '',
  phone: null,
  email: null,
  logo_url: null,
  website: null,
  default_material_cost: 5,
  default_labor_cost: 3,
  default_waste_pct: 10,
  default_markup_pct: 0,
  default_deposit_pct: 50,
  default_tax_pct: 0,
  material_prices_by_type: null,
  payment_terms: null,
  quote_number_prefix: null,
  invoice_number_prefix: null,
  next_quote_number: 1,
  next_invoice_number: 1,
  default_quote_valid_days: 30,
  terms_validity: 'Prices subject to change without notice after 30 days of estimate.',
  terms_scheduling: 'Additional fees may occur if work is not done at one time.',
  terms_scope: 'Any additional work will be priced and billed separately.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/billing/setup')

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', membership.company_id)
    .single()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Configure your company info and default quote values
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <SettingsForm
          settings={(settings as CompanySettings) || { ...DEFAULT_SETTINGS, company_id: membership.company_id }}
        />
      </Suspense>
    </div>
  )
}
