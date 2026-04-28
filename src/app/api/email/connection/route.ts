import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ connected: false })

  const { data: conn } = await supabase
    .from('email_connections')
    .select('provider,email_address')
    .eq('company_id', membership.company_id)
    .single()

  if (!conn) return NextResponse.json({ connected: false })

  return NextResponse.json({
    connected: true,
    provider: conn.provider as string,
    email_address: conn.email_address as string,
  })
}
