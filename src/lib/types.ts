export type QuoteStatus = 'pending' | 'accepted' | 'lost'
export type MeasurementType = 'manual' | 'rooms'
export type FlooringType = 'hardwood' | 'vinyl' | 'tile' | 'carpet' | 'laminate'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export interface Company {
  id: string
  name: string
  created_by: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  current_period_end: string | null
  created_at: string
}

export interface CompanyMember {
  company_id: string
  user_id: string
  role: 'owner' | 'member'
}

export interface CompanySettings {
  company_id: string
  company_name: string
  phone: string | null
  email: string | null
  logo_url: string | null
  default_material_cost: number
  default_labor_cost: number
  default_waste_pct: number
  default_markup_pct: number
  default_deposit_pct: number
}

export interface QuoteRoom {
  id: string
  quote_id: string
  name: string | null
  section: string | null
  length: number
  width: number
  sqft: number
}

export interface Quote {
  id: string
  company_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  job_address: string | null
  flooring_type: FlooringType
  measurement_type: MeasurementType
  base_sqft: number
  waste_pct: number
  adjusted_sqft: number
  material_cost_per_sqft: number
  labor_cost_per_sqft: number
  removal_fee: number
  furniture_fee: number
  stairs_fee: number
  delivery_fee: number
  custom_fee_label: string | null
  custom_fee_amount: number
  tax_enabled: boolean
  tax_pct: number
  markup_pct: number
  deposit_pct: number
  material_total: number
  labor_total: number
  extras_total: number
  subtotal: number
  tax_amount: number
  markup_amount: number
  final_total: number
  deposit_amount: number
  status: QuoteStatus
  notes: string | null
  valid_days: number
  created_at: string
  updated_at: string
}
