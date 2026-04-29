import type { SupabaseClient } from '@supabase/supabase-js'

interface Input {
  customer_name: string | null | undefined
  customer_phone: string | null | undefined
  customer_email: string | null | undefined
  job_address: string | null | undefined
}

/**
 * Upsert the quote's customer into the company contact book.
 * - Match priority: phone > email > exact (case-insensitive) name.
 * - If a match exists, fill in any missing fields without overwriting existing values.
 * - If no match exists, insert a fresh row.
 * - Best-effort — caller must wrap in try/catch; this helper does not throw.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncCustomerFromQuote(supabase: SupabaseClient<any, any, any>, companyId: string, input: Input) {
  const name = (input.customer_name ?? '').trim()
  if (!name) return

  const phone = (input.customer_phone ?? '').trim() || null
  const email = (input.customer_email ?? '').trim() || null
  const address = (input.job_address ?? '').trim() || null

  // Find an existing customer by phone, then email, then name (case-insensitive).
  let existing: { id: string; name: string; phone: string | null; email: string | null; address: string | null; notes: string | null } | null = null

  if (phone) {
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, notes')
      .eq('company_id', companyId)
      .eq('phone', phone)
      .maybeSingle()
    if (data) existing = data
  }

  if (!existing && email) {
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, notes')
      .eq('company_id', companyId)
      .ilike('email', email)
      .maybeSingle()
    if (data) existing = data
  }

  if (!existing) {
    const { data } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, notes')
      .eq('company_id', companyId)
      .ilike('name', name)
      .maybeSingle()
    if (data) existing = data
  }

  if (existing) {
    // Always update name; update phone/email/address when the quote provides a value
    // (preserve existing values when the quote field is empty/null).
    const patch: Record<string, string | null> = { name }
    if (phone) patch.phone = phone
    if (email) patch.email = email
    if (address) patch.address = address
    await supabase.from('customers').update(patch).eq('id', existing.id)
    return
  }

  await supabase.from('customers').insert({
    company_id: companyId,
    name,
    phone,
    email,
    address,
    notes: null,
  })
}
