import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/components/QuotePdf'
import type { Quote, QuoteRoom, CompanySettings } from '@/lib/types'
import React from 'react'
import { Resend } from 'resend'

export const runtime = 'nodejs'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
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

  // Generate PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuotePdfDocument as any, {
    quote: q,
    rooms: (rooms as QuoteRoom[]) || [],
    settings: settings as CompanySettings | null,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer: Buffer = await (renderToBuffer as any)(element)

  const companyName = (settings as CompanySettings | null)?.company_name || 'Your Flooring Contractor'
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const htmlBody = `
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

  const textBody = `Hi ${q.customer_name},

Thank you for the opportunity to provide you with a flooring estimate. Please find your detailed estimate attached.

Estimate Total: ${fmt(q.final_total)}
Deposit Required (${q.deposit_pct}%): ${fmt(q.deposit_amount)}
Remaining Balance: ${fmt(q.final_total - q.deposit_amount)}
Valid For: ${q.valid_days} days

If you have any questions or would like to move forward, please don't hesitate to reach out.

Best regards,
${companyName}`

  const safeName = q.customer_name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: q.customer_email,
      subject: `Your Flooring Estimate – ${q.customer_name}`,
      html: htmlBody,
      text: textBody,
      attachments: [
        {
          filename: `FloorQuote-${safeName}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
