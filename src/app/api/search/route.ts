import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ quotes: [], contacts: [] })

  const pattern = `%${q}%`
  const companyId = membership.company_id

  const [quotesResult, contactsResult] = await Promise.all([
    supabase
      .from('quotes')
      .select('id, customer_name, estimate_number, job_address, status, created_at')
      .eq('company_id', companyId)
      .or(
        `customer_name.ilike.${pattern},job_address.ilike.${pattern},flooring_type.ilike.${pattern},material_description.ilike.${pattern}`
      )
      .limit(5),
    supabase
      .from('customers')
      .select('id, name, phone, email, company')
      .eq('company_id', companyId)
      .or(
        `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern},address.ilike.${pattern},company.ilike.${pattern}`
      )
      .limit(5),
  ])

  // Also search estimate_number as text (numeric column — filter separately)
  const estimateNumber = parseInt(q, 10)
  let extraQuotes: typeof quotesResult.data = []
  if (!isNaN(estimateNumber)) {
    const { data } = await supabase
      .from('quotes')
      .select('id, customer_name, estimate_number, job_address, status, created_at')
      .eq('company_id', companyId)
      .eq('estimate_number', estimateNumber)
      .limit(5)
    extraQuotes = data ?? []
  }

  const seenIds = new Set<string>()
  const quotes: typeof quotesResult.data = []
  for (const q of [...(quotesResult.data ?? []), ...extraQuotes]) {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id)
      quotes.push(q)
    }
  }

  return NextResponse.json({
    quotes: quotes.slice(0, 5),
    contacts: contactsResult.data ?? [],
  })
}
