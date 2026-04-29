import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InvoiceForm from '@/components/InvoiceForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('company_members').select('company_id').eq('user_id', user.id).single()
  if (!membership) redirect('/billing/setup')

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <Link href="/invoices" className="text-xs font-medium text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-2">
          ← Back to Invoices
        </Link>
        <h1 className="text-base font-semibold text-gray-900">New invoice</h1>
      </div>
      <InvoiceForm defaultTab={tab === 'upload' ? 'upload' : 'form'} />
    </div>
  )
}
