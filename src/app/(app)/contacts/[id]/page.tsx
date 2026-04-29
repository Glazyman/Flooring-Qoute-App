import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { fmt } from '@/lib/calculations'
import { formatPhone } from '@/lib/format'
import { Pencil, Mail, Phone, MapPin, FileText } from 'lucide-react'
import type { Quote } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}

const STATUS_DOT: Record<string, { color: string; label: string }> = {
  measurement: { color: '#3B82F6', label: 'Measurement' },
  pending: { color: '#6366F1', label: 'Pending' },
  accepted: { color: '#10B981', label: 'Accepted' },
  lost: { color: '#EF4444', label: 'Lost' },
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Escape characters that have special meaning inside a Supabase .or() filter value.
// The .or() string is comma-separated and uses parentheses for grouping, so any
// of those chars in the value need to be removed/escaped to avoid breaking the parser.
function safeOrValue(v: string): string {
  return v.replace(/[(),*]/g, ' ').trim()
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/billing/setup')

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .single()

  if (!customer) notFound()

  const c = customer as Customer

  // Build OR filter for quotes that match this contact by phone, email, or exact name (case-insensitive).
  const orParts: string[] = []
  if (c.phone) {
    const v = safeOrValue(c.phone)
    if (v) orParts.push(`customer_phone.eq.${v}`)
  }
  if (c.email) {
    const v = safeOrValue(c.email)
    if (v) orParts.push(`customer_email.ilike.${v}`)
  }
  if (c.name) {
    const v = safeOrValue(c.name)
    if (v) orParts.push(`customer_name.ilike.${v}`)
  }

  let quotes: Quote[] = []
  if (orParts.length > 0) {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('company_id', membership.company_id)
      .or(orParts.join(','))
      .order('created_at', { ascending: false })
      .limit(50)
    quotes = (data ?? []) as Quote[]
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900 truncate min-w-0">
          {c.name}
        </h1>
        <Link
          href={`/contacts?edit=${c.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
          style={{ background: 'white', border: '1px solid #E5E7EB' }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      {/* Contact details */}
      <Card title="Contact details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {c.phone && (
            <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={formatPhone(c.phone)} />
          )}
          {c.email && (
            <DetailRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={c.email} />
          )}
          {c.address && (
            <DetailRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Address"
              value={c.address}
              full
            />
          )}
        </div>
        {c.notes && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F1F1F4' }}>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Notes
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-700">
              {c.notes}
            </p>
          </div>
        )}
        {!c.phone && !c.email && !c.address && !c.notes && (
          <p className="text-sm text-gray-400">No additional details on file.</p>
        )}
      </Card>

      {/* Quote history */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#FAFAFA', borderBottom: '1px solid #F1F1F4' }}>
          <h2 className="text-sm font-semibold text-gray-900">Quote history</h2>
          <span className="text-xs text-gray-400">{quotes.length}</span>
        </div>
        {quotes.length === 0 ? (
          <div className="p-12 text-center">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center mx-auto mb-3 bg-gray-100"
            >
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold mb-1 text-gray-900">
              No quotes yet
            </p>
            <p className="text-xs text-gray-500">
              Quotes saved with this contact&apos;s phone, email, or name will appear here.
            </p>
          </div>
        ) : (
          <div>
            {quotes.map((q, idx) => {
              const cfg = STATUS_DOT[q.status] || { color: '#9CA3AF', label: q.status }
              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/60"
                  style={{ borderBottom: idx < quotes.length - 1 ? '1px solid #F5F5F7' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-medium truncate text-gray-900">
                        {q.customer_name}
                      </p>
                      <span className="text-xs flex items-center gap-1.5 flex-shrink-0" style={{ color: cfg.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5 text-gray-500">
                      {q.flooring_type} · {q.adjusted_sqft.toFixed(0)} sqft · {fmtDate(q.created_at)}
                      {q.job_address ? ` · ${q.job_address}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0 text-gray-900">
                    {fmt(q.final_total)}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  full,
}: {
  icon: React.ReactNode
  label: string
  value: string
  full?: boolean
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span>
        {label}
      </p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}
