import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/emailTokens'

export const runtime = 'nodejs'

export async function POST() {
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

  const { data: conn } = await supabase
    .from('email_connections')
    .select('*')
    .eq('company_id', membership.company_id)
    .eq('provider', 'gmail')
    .single()

  if (conn) {
    // Best-effort revoke at Google so the access shows as removed in the
    // user's Google account; failures shouldn't block the local disconnect.
    try {
      const accessToken = decryptToken(conn.access_token)
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } catch {
      // ignore revoke failures
    }

    await supabase.from('email_connections').delete().eq('id', conn.id)
  }

  return NextResponse.json({ ok: true })
}
