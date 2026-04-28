import { decryptToken, encryptToken } from './emailTokens'
import { createClient } from './supabase/server'

export async function getValidGmailAccessToken(
  companyId: string
): Promise<{ accessToken: string; emailAddress: string } | null> {
  const supabase = await createClient()
  const { data: conn } = await supabase
    .from('email_connections')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', 'gmail')
    .single()
  if (!conn) return null

  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0
  const now = Date.now()
  // If still valid for at least 60s, return existing
  if (expiresAt - now > 60_000) {
    return { accessToken: decryptToken(conn.access_token), emailAddress: conn.email_address }
  }

  // Refresh
  const refreshToken = decryptToken(conn.refresh_token)
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  if (!res.ok) return null
  const data = await res.json()
  const newAccess = data.access_token as string
  const expiresIn = data.expires_in as number
  const newExpiresAt = new Date(now + expiresIn * 1000).toISOString()

  await supabase
    .from('email_connections')
    .update({
      access_token: encryptToken(newAccess),
      token_expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conn.id)

  return { accessToken: newAccess, emailAddress: conn.email_address }
}

export async function sendGmailMessage(opts: {
  accessToken: string
  fromName: string
  fromEmail: string
  to: string
  subject: string
  htmlBody: string
  bcc?: string
  attachment?: { filename: string; contentBase64: string; mimeType: string }
}): Promise<{ ok: boolean; error?: string }> {
  const { accessToken, fromName, fromEmail, to, subject, htmlBody, bcc, attachment } = opts
  const boundary = `floorquote_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail

  const lines: string[] = []
  lines.push(`From: ${fromHeader}`)
  lines.push(`To: ${to}`)
  if (bcc) lines.push(`Bcc: ${bcc}`)
  lines.push(`Subject: ${subject}`)
  lines.push('MIME-Version: 1.0')

  if (attachment) {
    lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
    lines.push('')
    lines.push(`--${boundary}`)
    lines.push('Content-Type: text/html; charset="UTF-8"')
    lines.push('Content-Transfer-Encoding: 7bit')
    lines.push('')
    lines.push(htmlBody)
    lines.push('')
    lines.push(`--${boundary}`)
    lines.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`)
    lines.push('Content-Transfer-Encoding: base64')
    lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
    lines.push('')
    // Split base64 into 76-char lines per RFC
    const chunked = (attachment.contentBase64.match(/.{1,76}/g) || []).join('\r\n')
    lines.push(chunked)
    lines.push('')
    lines.push(`--${boundary}--`)
  } else {
    lines.push('Content-Type: text/html; charset="UTF-8"')
    lines.push('Content-Transfer-Encoding: 7bit')
    lines.push('')
    lines.push(htmlBody)
  }

  const raw = lines.join('\r\n')
  // base64url encode (replace +/ → -_, strip = padding)
  const encoded = Buffer.from(raw, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false, error: errText }
  }
  return { ok: true }
}
