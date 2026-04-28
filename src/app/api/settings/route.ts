import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 404 })

  const body = await request.json()

  const { error } = await supabase
    .from('company_settings')
    .upsert(
      {
        company_id: membership.company_id,
        company_name: body.company_name,
        phone: body.phone || null,
        email: body.email || null,
        logo_url: body.logo_url || null,
        website: body.website || null,
        default_material_cost: body.default_material_cost,
        default_labor_cost: body.default_labor_cost,
        default_waste_pct: body.default_waste_pct,
        default_markup_pct: body.default_markup_pct,
        default_deposit_pct: body.default_deposit_pct,
        default_tax_pct: body.default_tax_pct ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep companies.name in sync so the sidebar logo reflects the updated name
  if (body.company_name) {
    await supabase
      .from('companies')
      .update({ name: body.company_name })
      .eq('id', membership.company_id)
  }

  return NextResponse.json({ ok: true })
}
