import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses service role to set up company after signup
export async function POST(request: NextRequest) {
  const { userId, email, fullName, companyName } = await request.json()

  if (!userId || !email || !companyName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check if company already exists for this user
  const { data: existing } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return NextResponse.json({ ok: true })
  }

  // Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ name: companyName, created_by: userId })
    .select()
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }

  // Create membership
  await supabase
    .from('company_members')
    .insert({ company_id: company.id, user_id: userId, role: 'owner' })

  // Create default settings
  await supabase.from('company_settings').insert({
    company_id: company.id,
    company_name: companyName,
    email: email,
    default_material_cost: 5.0,
    default_labor_cost: 3.0,
    default_waste_pct: 10.0,
    default_markup_pct: 0.0,
    default_deposit_pct: 50.0,
  })

  // Upsert profile
  await supabase.from('profiles').upsert({
    id: userId,
    email,
    full_name: fullName || null,
  })

  return NextResponse.json({ ok: true })
}
