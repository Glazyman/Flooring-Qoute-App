import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Invoice, InvoiceLineItem } from '@/lib/types'
import InvoiceStatusButton from '@/components/InvoiceStatusButton'
import { FileText, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-50 text-blue-600',
  paid: 'bg-green-50 text-green-700',
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

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <Link href="/invoices" className="text-xs font-medium text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-2">
          ← Back to Invoices
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{inv.customer_name}</h1>
            {inv.invoice_number && (
              <p className="text-sm text-gray-400 mt-0.5">Invoice #{inv.invoice_number}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {inv.status}
            </span>
            <InvoiceStatusButton invoiceId={inv.id} currentStatus={inv.status} />
          </div>
        </div>
      </div>

      {/* Uploaded PDF */}
      {inv.file_url && (
        <div className="bg-white rounded-xl p-5 flex items-center gap-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">Uploaded Invoice</p>
            <p className="text-xs text-gray-400 truncate">{inv.file_url.split('/').pop()}</p>
          </div>
          <a
            href={inv.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0"
            style={{ color: 'var(--primary)' }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </a>
        </div>
      )}

      {/* Customer info */}
      <div className="bg-white rounded-xl p-5 space-y-3" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Customer Info</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Name', value: inv.customer_name },
            { label: 'Phone', value: inv.customer_phone },
            { label: 'Email', value: inv.customer_email },
            { label: 'Address', value: inv.job_address },
          ].map(({ label, value }) =>
            value ? (
              <div key={label}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800">{value}</p>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Line items */}
      {lineItems.length > 0 && (
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Line Items</p>
          <div className="space-y-2">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center gap-3 text-sm py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{item.description}</p>
                  <p className="text-xs text-gray-400">{item.quantity} × {fmt(item.unit_price)}</p>
                </div>
                <p className="font-semibold text-gray-900">{fmt(item.total)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
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
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1">
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>{fmt(inv.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {inv.notes && (
        <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Notes</p>
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
