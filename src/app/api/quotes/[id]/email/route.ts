import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/components/QuotePdf'
import type { Quote, QuoteRoom, CompanySettings } from '@/lib/types'
import React from 'react'
import { Resend } from 'resend'

export const runtime = 'nodejs'

function buildHtmlBody(
  q: Quote,
  companyName: string,
  companyEmail: string | null,
  companyPhone: string | null
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const contactLine = companyEmail
    ? `<p style="margin:0 0 8px;">To get in touch, contact us at: <a href="mailto:${companyEmail}" style="color:#0d9488;">${companyEmail}</a></p>`
    : ''
  const phoneLine = companyPhone
    ? `<p style="margin:0 0 8px;">Phone: <a href="tel:${companyPhone}" style="color:#0d9488;">${companyPhone}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0d9488;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${companyName}</h1>
            <p style="margin:6px 0 0;color:#ccfbf1;font-size:14px;">Flooring Estimate</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111;">Hi ${q.customer_name},</p>
            <p style="margin:0 0 24px;color:#444;line-height:1.6;">
              Thank you for the opportunity to provide you with a flooring estimate.
              Please find your detailed estimate attached to this email.
            </p>

            <!-- Summary table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
              <tr>
                <td style="padding:12px 16px;background:#f0fdfa;border-radius:8px 0 0 0;font-weight:600;color:#0d9488;font-size:14px;">Estimate Total</td>
                <td style="padding:12px 16px;background:#f0fdfa;border-radius:0 8px 0 0;font-weight:700;font-size:20px;color:#111;">${fmt(q.final_total)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#555;font-size:14px;">Deposit Required (${q.deposit_pct}%)</td>
                <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#111;">${fmt(q.deposit_amount)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#555;font-size:14px;">Remaining Balance</td>
                <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;color:#111;">${fmt(q.final_total - q.deposit_amount)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-weight:600;color:#555;font-size:14px;">Valid For</td>
                <td style="padding:12px 16px;color:#111;">${q.valid_days} days</td>
              </tr>
            </table>

            <p style="margin:0 0 24px;color:#444;line-height:1.6;">
              If you have any questions or would like to move forward, please don't hesitate to reach out.
              We look forward to working with you!
            </p>

            <!-- Contact info -->
            <div style="border-top:1px solid #e5e7eb;padding-top:20px;color:#555;font-size:14px;">
              ${contactLine}
              ${phoneLine}
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:18px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email not configured. Add RESEND_API_KEY to Vercel.' },
      { status: 503 }
    )
  }

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

  const [{ data: rooms }, { data: settings }] = await Promise.all([
    supabase.from('quote_rooms').select('*').eq('quote_id', id).order('id'),
    supabase.from('company_settings').select('*').eq('company_id', membership.company_id).single(),
  ])

  const s = settings as CompanySettings | null
  const companyName = s?.company_name || 'Your Flooring Contractor'
  const companyEmail = s?.email || null
  const companyPhone = s?.phone || null

  const safeName = q.customer_name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
  const subject = `Your Flooring Estimate – ${q.customer_name}`
  const htmlBody = buildHtmlBody(q, companyName, companyEmail, companyPhone)

  // Generate PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuotePdfDocument as any, {
    quote: q,
    rooms: (rooms as QuoteRoom[]) || [],
    settings: s,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer: Buffer = await (renderToBuffer as any)(element)

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const payload: Parameters<typeof resend.emails.send>[0] = {
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
    }

    if (companyEmail) {
      payload.bcc = companyEmail
    }

    const { error } = await resend.emails.send(payload)
    if (error) {
      let msg = error.message
      if (/only send|testing emails|verify a domain/i.test(msg)) {
        msg +=
          ' Add a verified domain at resend.com/domains, then set RESEND_FROM_EMAIL in Vercel to an address on that domain (e.g. quotes@yourdomain.com).'
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ ok: true, via: 'resend' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
