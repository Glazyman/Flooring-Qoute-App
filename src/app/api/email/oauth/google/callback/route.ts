import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { encryptToken } from '@/lib/emailTokens'

export const runtime = 'nodejs'

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://floorquote.us'
}

function errorRedirect(message: string): NextResponse {
  const url = new URL('/settings', siteUrl())
  url.searchParams.set('tab', 'email')
  url.searchParams.set('error', message)
  return NextResponse.redirect(url.toString(), { status: 302 })
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const oauthError = request.nextUrl.searchParams.get('error')

  if (oauthError) return errorRedirect(oauthError)
  if (!code || !state) return errorRedirect('missing_code_or_state')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get('oauth_state')?.value
  cookieStore.delete('oauth_state')

  if (!expectedState || expectedState !== state) {
    return errorRedirect('invalid_state')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return errorRedirect('unauthorized')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return errorRedirect('no_company')

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) return errorRedirect('oauth_not_configured')

  const redirectUri = `${siteUrl()}/api/email/oauth/google/callback`

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
    }).toString(),
  })

  if (!tokenRes.ok) {
    return errorRedirect('token_exchange_failed')
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string
    token_type?: string
  }

  if (!tokenData.refresh_token) {
    // Without a refresh token we can't keep the connection alive long-term.
    return errorRedirect('missing_refresh_token')
  }

  // Fetch the connected Google account's email address
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  if (!userInfoRes.ok) return errorRedirect('userinfo_failed')

  const userInfo = (await userInfoRes.json()) as { email?: string }
  if (!userInfo.email) return errorRedirect('no_email')

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  const { error: upsertError } = await supabase
    .from('email_connections')
    .upsert(
      {
        company_id: membership.company_id,
        provider: 'gmail',
        email_address: userInfo.email,
        access_token: encryptToken(tokenData.access_token),
        refresh_token: encryptToken(tokenData.refresh_token),
        token_expires_at: expiresAt,
        scope: tokenData.scope ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id' }
    )

  if (upsertError) return errorRedirect('save_failed')

  const successUrl = new URL('/settings', siteUrl())
  successUrl.searchParams.set('tab', 'email')
  successUrl.searchParams.set('connected', '1')
  return NextResponse.redirect(successUrl.toString(), { status: 302 })
}
