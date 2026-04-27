import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  const origin = new URL(request.url).origin
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || origin).replace(/\/$/, '')

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?error=gmail_denied`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${origin}/api/auth/gmail/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings?error=gmail_token`)
  }

  const tokenData = await tokenRes.json()
  const { access_token, refresh_token, expires_in } = tokenData

  // Fetch user email
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userRes.ok) {
    return NextResponse.redirect(`${appUrl}/settings?error=gmail_userinfo`)
  }

  const userData = await userRes.json()
  const emailAddress: string = userData.email

  // Get authenticated user + company
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`)
  }

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_company`)
  }

  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

  const { error: upsertError } = await supabase.from('email_connections').upsert(
    {
      company_id: membership.company_id,
      provider: 'gmail',
      email_address: emailAddress,
      access_token,
      refresh_token: refresh_token ?? null,
      expires_at: expiresAt,
    },
    { onConflict: 'company_id,provider' }
  )

  if (upsertError) {
    return NextResponse.redirect(`${appUrl}/settings?error=gmail_save`)
  }

  return NextResponse.redirect(`${appUrl}/settings?connected=gmail`)
}
