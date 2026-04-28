import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 403 })

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) return NextResponse.json({ error: 'No company' }, { status: 403 })

  const body = await req.json()
  const {
    invoice_number, customer_name, customer_email, customer_phone,
    job_address, line_items, subtotal, tax_pct, tax_amount,
    total, notes, file_url, status = 'draft',
  } = body

  if (!customer_name?.trim()) {
    return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
  }

  // Auto-generate invoice number from settings prefix + counter when none provided.
  let resolvedInvoiceNumber: string | null = invoice_number?.trim() ? invoice_number.trim() : null
  if (!resolvedInvoiceNumber) {
    try {
      const { data: settings } = await supabase
        .from('company_settings')
        .select('invoice_number_prefix, next_invoice_number')
        .eq('company_id', membership.company_id)
        .single()

      const prefix = (settings?.invoice_number_prefix ?? '').trim()
      const next = settings?.next_invoice_number ?? 1
      resolvedInvoiceNumber = prefix ? `${prefix}-${next}` : String(next)

      await supabase
        .from('company_settings')
        .update({ next_invoice_number: next + 1 })
        .eq('company_id', membership.company_id)
    } catch {
      // Non-fatal — fall back to no invoice number rather than blocking the create.
      resolvedInvoiceNumber = null
    }
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      company_id: membership.company_id,
      invoice_number: resolvedInvoiceNumber,
      customer_name: customer_name.trim(),
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
      job_address: job_address || null,
      line_items: line_items || [],
      subtotal: subtotal || 0,
      tax_pct: tax_pct || 0,
      tax_amount: tax_amount || 0,
      total: total || 0,
      notes: notes || null,
      file_url: file_url || null,
      status,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoice: data })
}
