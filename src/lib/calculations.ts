export interface QuoteInputs {
  base_sqft: number
  waste_pct: number
  material_cost_per_sqft: number
  labor_cost_per_sqft: number
  removal_fee: number
  furniture_fee: number
  stairs_fee: number
  delivery_fee: number
  quarter_round_fee: number
  reducers_fee: number
  custom_fee_amount: number
  tax_enabled: boolean
  tax_pct: number
  markup_pct: number
  deposit_pct: number
  // Optional overrides for per-section pricing
  material_total_override?: number
  labor_total_override?: number
}

export interface QuoteCalculations {
  adjusted_sqft: number
  material_total: number
  labor_total: number
  extras_total: number
  subtotal: number
  tax_amount: number
  markup_amount: number
  final_total: number
  deposit_amount: number
  remaining_balance: number
}

export function calculateQuote(inputs: QuoteInputs): QuoteCalculations {
  const adjusted_sqft = inputs.base_sqft * (1 + inputs.waste_pct / 100)
  const material_total = inputs.material_total_override ?? adjusted_sqft * inputs.material_cost_per_sqft
  const labor_total = inputs.labor_total_override ?? adjusted_sqft * inputs.labor_cost_per_sqft
  const extras_total =
    (inputs.removal_fee || 0) +
    (inputs.furniture_fee || 0) +
    (inputs.stairs_fee || 0) +
    (inputs.delivery_fee || 0) +
    (inputs.quarter_round_fee || 0) +
    (inputs.reducers_fee || 0) +
    (inputs.custom_fee_amount || 0)
  const subtotal = material_total + labor_total + extras_total
  const tax_amount = inputs.tax_enabled ? subtotal * (inputs.tax_pct / 100) : 0
  const markup_amount = subtotal * (inputs.markup_pct / 100)
  const final_total = subtotal + tax_amount + markup_amount
  const deposit_amount = final_total * (inputs.deposit_pct / 100)
  const remaining_balance = final_total - deposit_amount

  return {
    adjusted_sqft,
    material_total,
    labor_total,
    extras_total,
    subtotal,
    tax_amount,
    markup_amount,
    final_total,
    deposit_amount,
    remaining_balance,
  }
}

export function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
