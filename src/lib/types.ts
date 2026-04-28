export type QuoteStatus = 'measurement' | 'pending' | 'accepted' | 'lost'
export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  company_id: string
  invoice_number: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  job_address: string | null
  line_items: InvoiceLineItem[]
  subtotal: number
  tax_pct: number
  tax_amount: number
  total: number
  status: InvoiceStatus
  notes: string | null
  file_url: string | null
  created_at: string
}
export type MeasurementType = 'manual' | 'rooms'
export type FlooringType = 'hardwood' | 'vinyl' | 'lvt' | 'tile' | 'carpet' | 'laminate'

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
  website: string | null
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
  stair_count: number | null
  delivery_fee: number
  quarter_round_fee: number
  reducers_fee: number
  custom_fee_label: string | null
  custom_fee_amount: number
  finish_type: string | null
  wood_species: string | null
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
