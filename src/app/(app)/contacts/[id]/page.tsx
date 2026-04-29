import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContactDetailClient from '@/components/ContactDetailClient'
import type { Quote } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  company: string | null
  notes: string | null
  created_at: string
}

// Escape characters that have special meaning inside a Supabase .or() filter value.
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

  return <ContactDetailClient initialCustomer={c} quotes={quotes} />
}
