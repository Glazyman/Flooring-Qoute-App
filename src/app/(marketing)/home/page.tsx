import Link from 'next/link'

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Quotes in Under 2 Minutes',
    desc: 'Fill in room measurements, select material, and get a professional PDF ready to send — faster than any spreadsheet.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: 'AI Blueprint Reading',
    desc: 'Snap a photo of a measurement sheet or floor plan and let AI extract all room dimensions automatically.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Professional PDF Estimates',
    desc: 'Branded quotes with your logo, contact info, itemized breakdown, and deposit terms — ready to email or print.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Mobile-First Design',
    desc: 'Built for the jobsite. Large tap targets, numeric keyboards, works great on any phone or tablet.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Track Every Job',
    desc: 'Dashboard shows revenue pipeline, accepted vs pending quotes, and total square footage at a glance.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Your Defaults, Saved',
    desc: 'Set your standard labor rate, material cost, markup, and deposit once. Every new quote starts pre-filled.',
  },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          3 free quotes — no credit card required
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
          Floor estimates in<br />
          <span className="text-blue-600">under 2 minutes.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          FloorQuote Pro is built for flooring contractors who need to quote fast, look professional, and win more jobs — from any phone or computer.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200"
          >
            Start for Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 font-semibold px-7 py-4 rounded-2xl text-base transition-colors"
          >
            Contact Us
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">No credit card · Cancel anytime</p>
      </section>

      {/* App preview placeholder */}
      <section className="max-w-5xl mx-auto px-5 mb-20">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 p-8 sm:p-12 flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-1 space-y-4">
            {[
              { label: 'Customer', value: 'John Smith' },
              { label: 'Address', value: '274 Cornwall Rd' },
              { label: 'Flooring', value: 'Hardwood · Red Oak' },
              { label: 'Area', value: '1,247 sqft (incl. 10% waste)' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                <span className="text-sm font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-md p-6 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Live Estimate</p>
            {[
              { label: 'Material', value: '$3,735' },
              { label: 'Labor', value: '$2,241' },
              { label: 'Stairs (14)', value: '$280' },
              { label: 'Quarter Round', value: '$180' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-semibold text-gray-800">{value}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-extrabold text-blue-600 text-lg">$6,871.40</span>
            </div>
            <div className="bg-blue-600 text-white text-center text-sm font-semibold py-2.5 rounded-xl mt-2">
              Download PDF Estimate
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Everything a flooring pro needs</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">No complicated software. No training required. Just fast, accurate quotes.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 border-y border-gray-100 py-20 mb-0">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Simple, honest pricing</h2>
          <p className="text-lg text-gray-500 mb-12">Start free, upgrade when you need more.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-left shadow-sm">
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Starter</p>
              <p className="text-4xl font-extrabold text-gray-900 mb-1">Free</p>
              <p className="text-sm text-gray-400 mb-6">No card needed</p>
              <ul className="space-y-3 mb-8">
                {['3 quotes included', 'PDF export', 'AI blueprint reading', 'Mobile-friendly'].map(i => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {i}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm">
                Get Started Free
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-blue-600 rounded-3xl p-8 text-left shadow-xl shadow-blue-200 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">Popular</div>
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide mb-2">Pro</p>
              <p className="text-4xl font-extrabold text-white mb-1">$29<span className="text-xl font-normal text-blue-200">/mo</span></p>
              <p className="text-sm text-blue-200 mb-6">Billed monthly</p>
              <ul className="space-y-3 mb-8">
                {['Unlimited quotes', 'Everything in Starter', 'Company branding', 'Priority support'].map(i => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white">
                    <svg className="w-4 h-4 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {i}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center bg-white hover:bg-blue-50 text-blue-600 font-bold py-3 rounded-xl transition-colors text-sm">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-5 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Ready to quote faster?</h2>
        <p className="text-lg text-gray-500 mb-8">Join flooring contractors already using FloorQuote Pro to win more jobs.</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors shadow-lg shadow-blue-200"
        >
          Create Your Free Account
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>
    </main>
  )
}
