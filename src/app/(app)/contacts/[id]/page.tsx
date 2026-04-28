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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  measurement: { bg: '#eff6ff', text: '#1d4ed8', label: 'Measurement' },
  pending: { bg: '#fffbeb', text: '#d97706', label: 'Pending' },
  accepted: { bg: '#f0fdf4', text: '#16a34a', label: 'Accepted' },
  lost: { bg: '#fef2f2', text: '#dc2626', label: 'Lost' },
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/contacts"
            className="text-xs font-medium hover:text-gray-600 mb-2 inline-flex items-center gap-1"
            style={{ color: 'var(--text-3)' }}
          >
            ← Back to Contacts
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight truncate" style={{ color: 'var(--text)' }}>
            {c.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {quotes.length} quote{quotes.length === 1 ? '' : 's'} on file
          </p>
        </div>
        <Link
          href={`/contacts?edit=${c.id}`}
          className="flex items-center gap-1.5 font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95 flex-shrink-0"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      {/* Contact details */}
      <Card>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-3)' }}>
          Contact Details
        </p>
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
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>
              Notes
            </p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)' }}>
              {c.notes}
            </p>
          </div>
        )}
        {!c.phone && !c.email && !c.address && !c.notes && (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No additional details on file.</p>
        )}
      </Card>

      {/* Quote history */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3 px-1" style={{ color: 'var(--text-3)' }}>
          Quote History
        </p>
        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center" style={{ border: '1px solid var(--border)' }}>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'var(--primary-light)' }}
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
              No quotes yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Quotes saved with this contact&apos;s phone, email, or name will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {quotes.map((q, idx) => {
              const cfg = STATUS_STYLES[q.status] || { bg: '#f9fafb', text: '#6b7280', label: q.status }
              return (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  style={{ borderBottom: idx < quotes.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                        {q.customer_name}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.text }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {q.flooring_type} · {q.adjusted_sqft.toFixed(0)} sqft · {fmtDate(q.created_at)}
                      {q.job_address ? ` · ${q.job_address}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--text)' }}>
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
      <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-3)' }}>
        <span style={{ color: 'var(--text-3)' }}>{icon}</span>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}
