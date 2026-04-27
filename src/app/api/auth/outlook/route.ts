import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Microsoft OAuth not configured' }, { status: 503 })
  }

  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/outlook/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile Mail.Send offline_access',
    response_mode: 'query',
  })

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  )
}
