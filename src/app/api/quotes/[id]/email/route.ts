import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/components/QuotePdf'
import type { Quote, QuoteRoom, CompanySettings } from '@/lib/types'
import React from 'react'
import { Resend } from 'resend'
import { google } from 'googleapis'

export const runtime = 'nodejs'

interface EmailConnection {
  provider: string
  email_address: string
  access_token: string
  refresh_token: string | null
  expires_at: string | null
}

async function refreshGmailToken(connection: EmailConnection): Promise<string> {
  if (!connection.refresh_token) throw new Error('No refresh token for Gmail')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Failed to refresh Gmail token')
  const data = await res.json()
  return data.access_token
}

async function refreshOutlookToken(connection: EmailConnection): Promise<string> {
  if (!connection.refresh_token) throw new Error('No refresh token for Outlook')

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
      scope: 'Mail.Send offline_access',
    }),
  })

  if (!res.ok) throw new Error('Failed to refresh Outlook token')
  const data = await res.json()
  return data.access_token
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() - 60_000 < Date.now()
}

function buildHtmlBody(q: Quote, companyName: string): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
      <h2 style="color: #0d9488;">Your Flooring Estimate is Ready</h2>
      <p>Hi ${q.customer_name},</p>
      <p>Thank you for the opportunity to provide you with a flooring estimate. Please find your detailed estimate attached to this email.</p>
      <table style="border-collapse: collapse; width: 100%; margin: 24px 0;">
        <tr>
          <td style="padding: 10px 14px; background: #f0fdfa; border-radius: 8px 0 0 8px; font-weight: 600; color: #0d9488;">Estimate Total</td>
          <td style="padding: 10px 14px; background: #f0fdfa; font-weight: 700; font-size: 18px; color: #111;">${fmt(q.final_total)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: 600; color: #555;">Deposit Required (${q.deposit_pct}%)</td>
          <td style="padding: 10px 14px; font-weight: 600; color: #111;">${fmt(q.deposit_amount)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: 600; color: #555;">Remaining Balance</td>
          <td style="padding: 10px 14px; color: #111;">${fmt(q.final_total - q.deposit_amount)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: 600; color: #555;">Valid For</td>
          <td style="padding: 10px 14px; color: #111;">${q.valid_days} days</td>
        </tr>
      </table>
      <p>If you have any questions or would like to move forward, please don't hesitate to reach out.</p>
      <p>We look forward to working with you!</p>
      <p style="margin-top: 32px; color: #555;">Best regards,<br/><strong>${companyName}</strong></p>
    </div>
  `
}

async function sendViaGmail(
  accessToken: string,
  fromAddress: string,
  companyName: string,
  toEmail: string,
  subject: string,
  htmlBody: string,
  pdfBuffer: Buffer,
  safeName: string
): Promise<void> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const gmail = google.gmail({ version: 'v1', auth })

  const boundary = 'floorquote_boundary_' + Date.now()
  const pdfBase64 = pdfBuffer.toString('base64')

  const rawMessage = [
    `From: ${companyName} <${fromAddress}>`,
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
    '',
    `--${boundary}`,
    'Content-Type: application/pdf',
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="FloorQuote-${safeName}.pdf"`,
    '',
    pdfBase64,
    `--${boundary}--`,
  ].join('\r\n')

  const encodedMessage = Buffer.from(rawMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedMessage },
  })
}

async function sendViaOutlook(
  accessToken: string,
  toEmail: string,
  subject: string,
  htmlBody: string,
  pdfBuffer: Buffer,
  safeName: string
): Promise<void> {
  const pdfBase64 = pdfBuffer.toString('base64')

  const res = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: toEmail } }],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: `FloorQuote-${safeName}.pdf`,
            contentType: 'application/pdf',
            contentBytes: pdfBase64,
          },
        ],
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Outlook send failed: ${errText}`)
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

  const q = quote as Quote

  if (!q.customer_email) {
    return NextResponse.json({ error: 'No customer email on file' }, { status: 400 })
  }

  const [{ data: rooms }, { data: settings }, { data: connections }] = await Promise.all([
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
    supabase.from('company_settings').select('*').eq('company_id', membership.company_id).single(),
    supabase
      .from('email_connections')
      .select('*')
      .eq('company_id', membership.company_id),
  ])

  const companyName = (settings as CompanySettings | null)?.company_name || 'Your Flooring Contractor'
  const safeName = q.customer_name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
  const subject = `Your Flooring Estimate is Ready – ${q.customer_name}`
  const htmlBody = buildHtmlBody(q, companyName)

  // Generate PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuotePdfDocument as any, {
    quote: q,
    rooms: (rooms as QuoteRoom[]) || [],
    settings: settings as CompanySettings | null,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer: Buffer = await (renderToBuffer as any)(element)

  const gmailConn = (connections as EmailConnection[] | null)?.find((c) => c.provider === 'gmail')
  const outlookConn = (connections as EmailConnection[] | null)?.find((c) => c.provider === 'outlook')

  try {
    if (gmailConn) {
      let accessToken = gmailConn.access_token
      if (isTokenExpired(gmailConn.expires_at)) {
        accessToken = await refreshGmailToken(gmailConn)
      }
      await sendViaGmail(
        accessToken,
        gmailConn.email_address,
        companyName,
        q.customer_email,
        subject,
        htmlBody,
        pdfBuffer,
        safeName
      )
      return NextResponse.json({ ok: true, via: 'gmail' })
    }

    if (outlookConn) {
      let accessToken = outlookConn.access_token
      if (isTokenExpired(outlookConn.expires_at)) {
        accessToken = await refreshOutlookToken(outlookConn)
      }
      await sendViaOutlook(
        accessToken,
        q.customer_email,
        subject,
        htmlBody,
        pdfBuffer,
        safeName
      )
      return NextResponse.json({ ok: true, via: 'outlook' })
    }

    // Fallback to Resend
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: `${companyName} <${fromEmail}>`,
        to: q.customer_email,
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: `FloorQuote-${safeName}.pdf`,
            content: pdfBuffer,
          },
        ],
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, via: 'resend' })
    }

    return NextResponse.json(
      { error: 'No email provider configured. Connect Gmail, Outlook, or add a RESEND_API_KEY.' },
      { status: 503 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
