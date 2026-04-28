import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Invoice, InvoiceLineItem, CompanySettings } from '@/lib/types'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtmlBody(
  inv: Invoice,
  lineItems: InvoiceLineItem[],
  companyName: string,
  companyEmail: string | null,
  companyPhone: string | null,
  paymentTerms: string | null
): string {
  const safeCompanyName = escapeHtml(companyName)
  const safeCustomerName = escapeHtml(inv.customer_name)
  const invoiceLabel = inv.invoice_number ? `#${escapeHtml(inv.invoice_number)}` : ''
  const dateLabel = new Date(inv.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const contactLine = companyEmail
    ? `<p style="margin:0 0 8px;">To get in touch, contact us at: <a href="mailto:${escapeHtml(companyEmail)}" style="color:#0D9488;">${escapeHtml(companyEmail)}</a></p>`
    : ''
  const phoneLine = companyPhone
    ? `<p style="margin:0 0 8px;">Phone: <a href="tel:${escapeHtml(companyPhone)}" style="color:#0D9488;">${escapeHtml(companyPhone)}</a></p>`
    : ''

  const lineItemRows = lineItems.length > 0
    ? lineItems.map(item => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">${escapeHtml(item.description || '')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#6b7280;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#6b7280;text-align:right;">${fmt(item.unit_price)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111;font-weight:600;text-align:right;">${fmt(item.total)}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:14px 12px;font-size:13px;color:#9ca3af;text-align:center;">No line items</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0D9488;padding:28px 32px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${safeCompanyName}</h1>
            <p style="margin:6px 0 0;color:#ccfbf1;font-size:14px;">Invoice ${invoiceLabel}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111;">Hi ${safeCustomerName},</p>
            <p style="margin:0 0 24px;color:#444;line-height:1.6;">
              Please find your invoice below. Reach out with any questions about the charges or payment.
            </p>

            <!-- Meta -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Invoice Date</td>
                <td style="padding:6px 0;font-size:13px;color:#111;font-weight:600;text-align:right;">${dateLabel}</td>
              </tr>
              ${inv.invoice_number ? `<tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Invoice Number</td>
                <td style="padding:6px 0;font-size:13px;color:#111;font-weight:600;text-align:right;">${escapeHtml(inv.invoice_number)}</td>
              </tr>` : ''}
            </table>

            <!-- Line items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:left;font-weight:700;border-bottom:1px solid #e5e7eb;">Description</th>
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:center;font-weight:700;border-bottom:1px solid #e5e7eb;">Qty</th>
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;font-weight:700;border-bottom:1px solid #e5e7eb;">Unit</th>
                  <th style="padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;text-align:right;font-weight:700;border-bottom:1px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>${lineItemRows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
              <tr>
                <td style="padding:6px 12px;font-size:14px;color:#6b7280;text-align:right;">Subtotal</td>
                <td style="padding:6px 12px;font-size:14px;color:#111;text-align:right;width:120px;">${fmt(inv.subtotal)}</td>
              </tr>
              ${inv.tax_pct > 0 ? `<tr>
                <td style="padding:6px 12px;font-size:14px;color:#6b7280;text-align:right;">Tax (${inv.tax_pct}%)</td>
                <td style="padding:6px 12px;font-size:14px;color:#111;text-align:right;">${fmt(inv.tax_amount)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 12px;font-size:15px;color:#111;font-weight:700;text-align:right;border-top:2px solid #111;">Total</td>
                <td style="padding:10px 12px;font-size:18px;color:#0D9488;font-weight:800;text-align:right;border-top:2px solid #111;">${fmt(inv.total)}</td>
              </tr>
            </table>

            ${paymentTerms ? `
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Payment Terms</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(paymentTerms)}</p>
            </div>` : ''}

            ${inv.notes ? `
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Notes</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.5;white-space:pre-wrap;">${escapeHtml(inv.notes)}</p>
            </div>` : ''}

            <p style="margin:0 0 24px;color:#444;line-height:1.6;">Thank you for your business!</p>

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email not configured. Add RESEND_API_KEY to Vercel.' },
      { status: 503 }
    )
  }

  let body: { to?: string } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const to = (body.to ?? '').trim()
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'Valid "to" email address is required' }, { status: 400 })
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

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .single()

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const inv = invoice as Invoice
  const lineItems = (inv.line_items ?? []) as InvoiceLineItem[]

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', membership.company_id)
    .single()

  const s = settings as CompanySettings | null
  const companyName = s?.company_name || 'Your Flooring Contractor'
  const companyEmail = s?.email || null
  const companyPhone = s?.phone || null
  const paymentTerms = s?.payment_terms || null

  const subject = inv.invoice_number
    ? `Invoice ${inv.invoice_number} from ${companyName}`
    : `Invoice from ${companyName}`

  const htmlBody = buildHtmlBody(inv, lineItems, companyName, companyEmail, companyPhone, paymentTerms)

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: `${companyName} <${fromEmail}>`,
      to,
      subject,
      html: htmlBody,
    }

    if (companyEmail && companyEmail !== to) {
      payload.bcc = companyEmail
    }

    const { error } = await resend.emails.send(payload)
    if (error) {
      let msg = error.message
      if (/only send|testing emails|verify a domain/i.test(msg)) {
        msg +=
          ' Add a verified domain at resend.com/domains, then set RESEND_FROM_EMAIL in Vercel to an address on that domain (e.g. invoices@yourdomain.com).'
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ success: true, via: 'resend' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
