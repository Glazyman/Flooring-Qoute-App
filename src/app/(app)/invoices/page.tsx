import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Invoice } from '@/lib/types'
import { FileText, Plus, Upload } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-50 text-blue-600',
  paid: 'bg-green-50 text-green-600',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', membership.company_id)
    .order('created_at', { ascending: false })

  const list = (invoices ?? []) as Invoice[]

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Invoices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Track and manage your invoices</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href="/invoices/new?tab=upload"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-3.5 py-2.5 rounded-2xl text-sm hover:bg-gray-50 transition-colors active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light)' }}>
            <FileText className="w-7 h-7" style={{ color: 'var(--primary)' }} />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No invoices yet</p>
          <p className="text-sm text-gray-400 mb-5">Create your first invoice or upload an existing one.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
            <Link
              href="/invoices/new?tab=upload"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-2xl text-sm hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" /> Upload PDF
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map(inv => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl px-4 sm:px-5 py-4 hover:shadow-md transition-shadow active:scale-[0.99]"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
                <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{inv.customer_name}</p>
                  {inv.invoice_number && (
                    <span className="text-xs text-gray-400">#{inv.invoice_number}</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                  {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {inv.job_address && ` · ${inv.job_address}`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {inv.status}
                </span>
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmt(inv.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
