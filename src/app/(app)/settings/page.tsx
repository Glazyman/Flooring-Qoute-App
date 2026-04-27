import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'
import type { CompanySettings } from '@/lib/types'

const DEFAULT_SETTINGS: CompanySettings = {
  company_id: '',
  company_name: '',
  phone: null,
  email: null,
  logo_url: null,
  default_material_cost: 5,
  default_labor_cost: 3,
  default_waste_pct: 10,
  default_markup_pct: 0,
  default_deposit_pct: 50,
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Configure your company info and default quote values
        </p>
      </div>
      <SettingsForm
        settings={(settings as CompanySettings) || { ...DEFAULT_SETTINGS, company_id: membership.company_id }}
      />
    </div>
  )
}
