import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list all saved calculations for this company
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 404 })

  const { data, error } = await supabase
    .from('takeoff_calculations')
    .select('id, name, rooms, waste_pct, total_sqft, created_at')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ calculations: data ?? [] })
}

// POST — save a new calculation
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 404 })

  const body = await request.json()
  const { name, rooms, waste_pct, total_sqft } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!Array.isArray(rooms)) return NextResponse.json({ error: 'Rooms must be an array' }, { status: 400 })

  const { data, error } = await supabase
    .from('takeoff_calculations')
    .insert({
      company_id: membership.company_id,
      name: name.trim(),
      rooms,
      waste_pct: waste_pct ?? 10,
      total_sqft: total_sqft ?? 0,
    })
    .select('id, name, rooms, waste_pct, total_sqft, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ calculation: data })
}
