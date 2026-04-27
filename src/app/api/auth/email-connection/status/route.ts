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

  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 404 })

  const { data: connections } = await supabase
    .from('email_connections')
    .select('provider, email_address')
    .eq('company_id', membership.company_id)

  const gmail = connections?.find((c) => c.provider === 'gmail')
  const outlook = connections?.find((c) => c.provider === 'outlook')

  return NextResponse.json({
    gmail: { connected: !!gmail, email: gmail?.email_address ?? null },
    outlook: { connected: !!outlook, email: outlook?.email_address ?? null },
  })
}
