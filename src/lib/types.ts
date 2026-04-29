export type QuoteStatus = 'measurement' | 'pending' | 'accepted' | 'lost'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void'

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
// Note: 'hardwood' is kept for backward compat with legacy quote records,
// but it is no longer offered as a selectable type in either Settings or
// the QuoteForm. New quotes must use one of the more specific types.
export type FlooringType =
  | 'hardwood'
  | 'unfinished'
  | 'prefinished'
  | 'engineered'
  | 'prefinished_engineered'
  | 'unfinished_engineered'
  | 'vinyl'
  | 'tile'
  | 'carpet'
  | 'laminate'

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
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  website: string | null
  default_material_cost: number
  default_labor_cost: number
  default_waste_pct: number
  default_markup_pct: number
  default_deposit_pct: number
  default_tax_pct: number
  material_prices_by_type: Record<string, { material: number; labor: number }> | null
  payment_terms: string | null
  quote_number_prefix: string | null
  invoice_number_prefix: string | null
  next_quote_number: number | null
  next_invoice_number: number | null
  default_quote_valid_days: number | null
  terms_validity: string | null
  terms_scheduling: string | null
  terms_scope: string | null
  default_inclusions?: string | null
  default_exclusions?: string | null
  default_qualifications?: string | null
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

export interface QuoteLineItem {
  id: string
  quote_id: string
  position: number
  description: string | null
  qty: number
  unit_price: number
  total: number
  uom?: string
  created_at: string
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
  scope_of_work: string | null
  material_description: string | null
  valid_days: number
  section_flooring_types: Record<string, FlooringType> | null
  extras_json: Record<string, number> | null
  quote_number: string | null
  inclusions?: string | null
  exclusions?: string | null
  qualifications?: string | null
  additional_details?: string | null
  created_at: string
  updated_at: string
}
