import { createClient } from '@/lib/supabase/server'
import ContactForm from './ContactForm'

export default async function ContactPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let prefill = { name: '', email: '', company: '', accountId: '' }

  if (user) {
    prefill.email = user.email ?? ''
    prefill.accountId = user.id

    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (membership) {
      const [settingsResult, companyResult] = await Promise.all([
        supabase
          .from('company_settings')
          .select('company_name')
          .eq('company_id', membership.company_id)
          .single(),
        supabase
          .from('companies')
          .select('name')
          .eq('id', membership.company_id)
          .single(),
      ])
      prefill.company = settingsResult.data?.company_name || companyResult.data?.name || ''
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-5 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Get in Touch</h1>
          <p className="text-lg text-gray-500">
            Questions about FloorQuote Pro? We&apos;d love to hear from you.
          </p>
        </div>
        <ContactForm prefill={prefill} />
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-500 mt-0.5">Response within 1 business day</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Support Hours</p>
              <p className="text-sm text-gray-500 mt-0.5">Mon – Fri, 9am – 6pm EST</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
