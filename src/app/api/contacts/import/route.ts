import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 403 })

  const body = await req.json()
  const { contacts } = body as {
    contacts: Array<{ name: string; phone?: string; email?: string; address?: string; notes?: string }>
  }

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
  }

  const rows = contacts
    .filter(c => c.name?.trim())
    .map(c => ({
      company_id: membership.company_id,
      name: c.name.trim(),
      phone: c.phone?.trim() || null,
      email: c.email?.trim() || null,
      address: c.address?.trim() || null,
      notes: c.notes?.trim() || null,
    }))

  const { data, error } = await supabase
    .from('customers')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ imported: data?.length ?? rows.length })
}
