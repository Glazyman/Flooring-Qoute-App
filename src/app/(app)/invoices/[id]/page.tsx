import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Invoice, InvoiceLineItem } from '@/lib/types'
import InvoiceStatusButton from '@/components/InvoiceStatusButton'
import EmailInvoiceButton from '@/components/EmailInvoiceButton'
import { FileText, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  draft: { color: '#F59E0B', label: 'Draft' },
  sent: { color: '#6366F1', label: 'Sent' },
  paid: { color: '#10B981', label: 'Paid' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .single()

  if (!data) notFound()

  const inv = data as Invoice
  const lineItems = (inv.line_items ?? []) as InvoiceLineItem[]

  const cfg = STATUS_DOT[inv.status] || { color: '#9CA3AF', label: inv.status }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{inv.customer_name}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-xs flex items-center gap-1.5" style={{ color: cfg.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                {cfg.label}
              </span>
              {inv.invoice_number && (
                <span className="text-xs text-gray-500">· #{inv.invoice_number}</span>
              )}
            </div>
          </div>
          <InvoiceStatusButton invoiceId={inv.id} currentStatus={inv.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-2">
          <EmailInvoiceButton invoiceId={inv.id} customerEmail={inv.customer_email} />
        </div>
      </div>

      {/* Uploaded PDF */}
      {inv.file_url && (
        <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Uploaded invoice</p>
            <p className="text-xs text-gray-500 truncate">{inv.file_url.split('/').pop()}</p>
          </div>
          <a
            href={inv.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
            style={{ background: 'white', border: '1px solid #E5E7EB' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </a>
        </div>
      )}

      {/* Customer info */}
      <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold text-gray-900">Customer info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Name', value: inv.customer_name },
            { label: 'Phone', value: inv.customer_phone },
            { label: 'Email', value: inv.customer_email },
            { label: 'Address', value: inv.job_address },
          ].map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm text-gray-900">{value}</p>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Line items */}
      {lineItems.length > 0 && (
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Line items</h2>
          <div className="space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center gap-3 text-sm py-2 last:border-0" style={{ borderBottom: i < lineItems.length - 1 ? '1px solid #F5F5F7' : 'none' }}>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.description}</p>
                  <p className="text-xs text-gray-500">{item.quantity} × {fmt(item.unit_price)}</p>
                </div>
                <p className="font-semibold text-gray-900">{fmt(item.total)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: '1px solid #F1F1F4' }}>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(inv.subtotal)}</span>
            </div>
            {inv.tax_pct > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax ({inv.tax_pct}%)</span>
                <span>{fmt(inv.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base text-gray-900 pt-1">
              <span>Total</span>
              <span>{fmt(inv.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {inv.notes && (
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{inv.notes}</p>
        </div>
      )}

      {/* Date */}
      <p className="text-xs text-gray-400 text-center pb-2">
        Created {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  )
}
