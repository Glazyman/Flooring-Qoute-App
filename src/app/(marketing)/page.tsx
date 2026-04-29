import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import PricingSection from '@/components/PricingSection'
import HomePageAuthHandler from '@/components/HomePageAuthHandler'

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Instant Take-Off Calculations',
    desc: 'Enter your room dimensions and the app handles material quantities, waste factor, labor, markup, tax, and deposit automatically. No spreadsheets.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Branded Estimate PDF',
    desc: 'Your logo, license number, contact info, itemized pricing, deposit terms, and validity date. Email it or hand it to the homeowner on the spot.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Built for the Jobsite',
    desc: 'Pull it up on your phone while you walk the job. Large buttons, numeric keyboards, and auto-saved drafts so you never lose your work.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Multi-Area Projects',
    desc: 'Price hardwood on the main floor, LVT in the basement, and tile in the kitchen all in one estimate. Each area gets its own material and labor rate.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Job Scope Checklist',
    desc: 'Check off sand and finish, glue down, nail down, floating, removal, subfloor prep, and transitions so nothing is missed on the write-up.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'All the Add-Ons Priced In',
    desc: 'Stairs, quarter round, reducers, transitions, underlayment, furniture moving, disposal fees. Every line item on the estimate so there are no surprises.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Track Your Pipeline',
    desc: 'See every open measurement, pending estimate, and closed job on one dashboard. Know your revenue at a glance without digging through emails.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Duplicate and Reuse',
    desc: 'Same customer, similar house? Clone any past estimate in one tap, update the rooms, and send. Half the time on repeat jobs.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Your Rates Always Ready',
    desc: 'Set your material and labor rates by flooring type once. Every new project loads your numbers so you start estimating immediately.',
  },
]

const PAIN_POINTS = [
  { before: 'Hand-writing numbers at the kitchen table after the walkthrough', after: 'Estimate finished before you leave the driveway' },
  { before: 'Forgetting stairs, disposal, or quarter round on the write-up', after: 'Every add-on has its own line item so nothing gets missed' },
  { before: 'Sending a rough number by text and hoping they remember it', after: 'Professional branded PDF in the homeowner\'s inbox in minutes' },
  { before: 'Losing track of which jobs you measured and what you quoted', after: 'Full pipeline on one screen from measurement to closed job' },
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const code = typeof params.code === 'string' ? params.code : null
  if (code) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string') qs.set(k, v)
    }
    redirect(`/auth/callback?${qs.toString()}`)
  }

  return (
    <main className="marketing-page">
      <HomePageAuthHandler />

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-5 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 sm:mb-8">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
          3 free quotes. No credit card needed.
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-5 sm:mb-6">
          Flooring estimates.<br />
          <span style={{ color: 'var(--primary)' }}>Done at the walkthrough.</span>
        </h1>

        <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          FloorQuote Pro is built for flooring contractors. Do your take-off, price the job, and hand the homeowner a professional estimate before you pull out of the driveway.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 text-white font-bold px-7 py-4 rounded-2xl text-base"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(13,148,136,0.35)' }}
          >
            Start for Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-7 py-4 rounded-2xl text-base transition-colors"
          >
            Sign In
          </Link>
        </div>
        <p className="text-sm text-gray-400">No credit card. Cancel anytime.</p>
      </section>

      {/* ── Live estimate mockup ── */}
      <section className="max-w-4xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Customer & Job</p>
              {[
                { label: 'Customer', value: 'John Smith' },
                { label: 'Address',  value: '274 Cornwall Rd' },
                { label: 'Flooring', value: 'Hardwood, Red Oak' },
                { label: 'Area',     value: '1,247 sqft (10% waste)' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 flex justify-between items-center gap-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide shrink-0">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Live Estimate</p>
              <div className="space-y-3 flex-1">
                {[
                  { label: 'Material (1,247 sqft)', value: '$4,988' },
                  { label: 'Labor',                  value: '$2,494' },
                  { label: 'Stairs (14)',             value: '$280'  },
                  { label: 'Quarter Round',           value: '$180'  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-900 shrink-0">{value}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-extrabold" style={{ color: 'var(--primary)' }}>$8,213.40</span>
              </div>
              <div className="mt-3 text-white text-center text-sm font-semibold py-3 rounded-xl" style={{ background: 'var(--primary)' }}>
                Download PDF Estimate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Blueprint Spotlight ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-28">
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left: copy */}
            <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6 self-start">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Pro Feature
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
                Snap the floor plan.<br />Skip the manual take-off.
              </h2>
              <p className="text-teal-100 text-base sm:text-lg leading-relaxed mb-8">
                Walk the job, take a photo of the blueprint or floor plan, and the AI pulls every room dimension automatically. Your take-off is done before you finish the walkthrough.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Works with any phone camera on site',
                  'Reads builder blueprints and hand-drawn plans',
                  'Room dimensions load straight into your estimate',
                  'Review and adjust before saving',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white text-sm font-medium">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white font-bold px-6 py-3.5 rounded-2xl text-sm self-start transition-opacity hover:opacity-90"
                style={{ color: 'var(--primary)' }}
              >
                Try it free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Right: visual mockup */}
            <div className="relative flex items-center justify-center p-8 sm:p-10 lg:p-12" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div className="w-full max-w-sm">
                {/* Phone frame */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ border: '6px solid rgba(255,255,255,0.2)' }}>
                  {/* Blueprint image area */}
                  <div className="relative bg-blue-50 flex items-center justify-center" style={{ height: 190 }}>
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(rgba(13,148,136,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.08) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }} />
                    {/* Floor plan sketch */}
                    <svg viewBox="0 0 200 140" className="w-48 relative z-10 opacity-70" fill="none" stroke="#0d9488" strokeWidth="2">
                      <rect x="10" y="10" width="85" height="60" />
                      <rect x="10" y="75" width="85" height="55" />
                      <rect x="100" y="10" width="90" height="120" />
                      <text x="35" y="45" fontSize="10" fill="#0d9488" fontWeight="600">Living</text>
                      <text x="35" y="58" fontSize="8" fill="#0f766e">14×18</text>
                      <text x="32" y="107" fontSize="10" fill="#0d9488" fontWeight="600">Kitchen</text>
                      <text x="35" y="119" fontSize="8" fill="#0f766e">14×15</text>
                      <text x="122" y="68" fontSize="10" fill="#0d9488" fontWeight="600">Master</text>
                      <text x="125" y="81" fontSize="8" fill="#0f766e">18×20</text>
                    </svg>
                    {/* Scanning overlay */}
                    <div className="absolute inset-x-0 top-1/3 h-0.5 opacity-60" style={{ background: 'linear-gradient(90deg, transparent, #0d9488, transparent)' }} />
                    <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-teal-700">Scanning…</span>
                    </div>
                  </div>
                  {/* Extracted rooms */}
                  <div className="p-4 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Rooms detected</p>
                    {[
                      { name: 'Living Room',  size: '14 × 18 ft', sqft: '252 sqft' },
                      { name: 'Kitchen',      size: '14 × 15 ft', sqft: '210 sqft' },
                      { name: 'Master Bed',   size: '18 × 20 ft', sqft: '360 sqft' },
                    ].map(r => (
                      <div key={r.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                          <p className="text-[10px] text-gray-400">{r.size}</p>
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{r.sqft}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-gray-400">Total area (10% waste)</span>
                      <span className="text-sm font-extrabold text-gray-900">910 sqft</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Pain → Gain ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Sound familiar?</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Stop leaving money on the table</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {PAIN_POINTS.map(({ before, after }) => (
            <div key={before} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex flex-col gap-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <p className="text-sm text-gray-400 line-through">{before}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <svg className="w-3 h-3" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <p className="text-sm font-semibold text-gray-800">{after}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>How it works</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">From walkthrough to signed estimate in minutes</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: '1', title: 'Do your take-off on site', desc: 'Enter room dimensions by hand or snap a photo of the blueprint. The AI reads the floor plan and fills in every room for you.' },
            { n: '2', title: 'Price the job your way', desc: 'Material, labor, waste, stairs, add-ons, markup, and tax all calculate live. Your saved rates load automatically on every new job.' },
            { n: '3', title: 'Send a professional estimate', desc: 'Download a branded PDF with your logo, itemized pricing, and deposit terms. Email it or show it on your phone right there.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="bg-white rounded-2xl sm:rounded-xl border border-gray-100 p-5 sm:p-6 flex gap-4 sm:block" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-extrabold text-base sm:mb-5" style={{ background: 'var(--primary)' }}>
                {n}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 text-[14px] sm:text-[15px]">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Features</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Everything a flooring contractor needs</h2>
          <p className="text-base sm:text-lg text-gray-400 mt-3 max-w-xl mx-auto">No complicated software. No training required. Just fast, accurate flooring estimates.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 flex gap-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(13,148,136,0.08)', color: 'var(--primary)' }}>
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1 text-[14px]">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sample Quote PDF mockup ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-28">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>The finished product</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">What your client receives</h2>
          <p className="text-base sm:text-lg text-gray-400 mt-3 max-w-xl mx-auto">
            A branded, itemized estimate PDF ready to email or hand over on the spot.
          </p>
        </div>

        {/* Scaled PDF page — written at 700px, scaled to ~60% so it looks like a real document thumbnail */}
        <div className="relative mx-auto" style={{ maxWidth: 440, height: 570 }}>

          {/* Paper shadow */}
          <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)', borderRadius: 6 }} />

          {/* Scaled inner document */}
          <div style={{
            width: 700,
            transformOrigin: 'top left',
            transform: 'scale(0.628)',
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'white',
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
          }}>

            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '20px 24px 14px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--primary)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>FP</div>
                <div>
                  <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, margin: '0 0 2px' }}>Premier Flooring Solutions</p>
                  <p style={{ color: '#64748b', fontSize: 10, margin: '0 0 1px' }}>123 Trade Street, Suite 4, Chicago, IL 60601</p>
                  <p style={{ color: '#64748b', fontSize: 10, margin: '0 0 1px' }}><b style={{ color: '#334155' }}>Office:</b> (312) 555-0182</p>
                  <p style={{ color: '#64748b', fontSize: 10, margin: 0 }}><b style={{ color: '#334155' }}>Email:</b> info@premierfloors.com</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 32, color: '#1e293b', lineHeight: 1, margin: 0 }}>Flooring</p>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#94a3b8', margin: '2px 0 8px' }}>Estimate</p>
                {[['Estimate Date:', 'Apr 29, 2026'], ['Estimate #:', 'EST-1042'], ['Valid For:', '30 days']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', borderBottom: '1px solid #e2e8f0', paddingBottom: 2, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 10, color: '#0f172a' }}>{l}</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CLIENT + PROJECT BOXES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 24px' }}>
              {[
                { title: 'Client Information:', rows: [['Name:', 'John & Sarah Williams'], ['Address:', '274 Cornwall Rd, Naperville IL'], ['Phone:', '(630) 555-0194'], ['Email:', 'jwilliams@email.com']] },
                { title: 'Project Details:', rows: [['Flooring:', 'Hardwood and LVT/Vinyl'], ['Main Floor:', '981 sqft Hardwood'], ['Basement:', '451 sqft LVT'], ['Color/Style:', 'Natural Oak, Matte']] },
              ].map(({ title, rows }) => (
                <div key={title} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '10px 12px' }}>
                  <p style={{ fontWeight: 700, fontSize: 11, color: '#0f172a', margin: '0 0 6px' }}>{title}</p>
                  {rows.map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 9.5, color: '#334155', width: 70, flexShrink: 0 }}>{l}</span>
                      <span style={{ fontSize: 9.5, color: '#475569' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* COST BREAKDOWN */}
            <div style={{ padding: '0 24px 12px' }}>
              <p style={{ fontWeight: 700, fontSize: 10, color: '#1e293b', margin: '0 0 6px' }}>Cost Breakdown</p>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '46% 13% 11% 14% 16%', background: '#1e293b', padding: '6px 10px' }}>
                  {['Item Description', 'Quantity', 'UoM', 'Unit Price', 'Total'].map((h, i) => (
                    <span key={h} style={{ fontWeight: 600, fontSize: 9.5, color: 'white', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
                  ))}
                </div>
                {/* Line items */}
                {[
                  ['Supply Hardwood (Main Floor)', '981.2', 'SF', '$5.20', '$5,102.24'],
                  ['Labor / installation (Main Floor)', '981.2', 'SF', '$3.50', '$3,434.20'],
                  ['Supply LVT/Vinyl (Basement)', '451.0', 'SF', '$3.80', '$1,713.80'],
                  ['Labor / installation (Basement)', '451.0', 'SF', '$2.75', '$1,240.25'],
                  ['Removal of existing flooring', '', 'LS', '$450.00', '$450.00'],
                  ['Stairs (12)', '12', 'EA', '$35.00', '$420.00'],
                  ['Quarter round / moldings', '', 'LS', '$280.00', '$280.00'],
                  ['Subfloor prep', '', 'LS', '$200.00', '$200.00'],
                ].map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '46% 13% 11% 14% 16%', padding: '5px 10px', borderBottom: '0.5px solid #e2e8f0' }}>
                    <span style={{ fontSize: 9, color: '#0f172a' }}>{row[0]}</span>
                    <span style={{ fontSize: 9, color: '#475569', textAlign: 'right' }}>{row[1]}</span>
                    <span style={{ fontSize: 9, color: '#94a3b8', textAlign: 'right' }}>{row[2]}</span>
                    <span style={{ fontSize: 9, color: '#475569', textAlign: 'right' }}>{row[3]}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{row[4]}</span>
                  </div>
                ))}
                {/* Signature */}
                <div style={{ padding: '8px 10px', borderBottom: '0.5px solid #e2e8f0' }}>
                  <p style={{ fontWeight: 700, fontSize: 9, color: '#374151', margin: '0 0 2px' }}>READ CAREFULLY — SIGN &amp; EMAIL BACK</p>
                  <p style={{ fontSize: 8.5, color: '#6b7280', margin: '0 0 8px' }}>You are authorized to do work as specified above.</p>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ borderBottom: '1px solid #374151', height: 16, marginBottom: 2 }} />
                      <p style={{ fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Authorized Signature</p>
                    </div>
                    <div style={{ width: 100 }}>
                      <div style={{ borderBottom: '1px solid #374151', height: 16, marginBottom: 2 }} />
                      <p style={{ fontSize: 7, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM: scope + totals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 16, padding: '0 24px 12px' }}>
              <div>
                <p style={{ fontSize: 9, color: '#334155', lineHeight: 1.5, margin: '0 0 4px' }}>Work includes prep, installation, transitions, quarter round, stairs, and cleanup. All labor warranted 1 year.</p>
                <p style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4, margin: 0 }}>Prices valid 30 days. 50% deposit required to schedule. Balance due upon completion.</p>
              </div>
              <div>
                {[['Subtotal', '$12,840.49'], ['Tax (8.5%)', '$1,091.44']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#334155', padding: '2px 0' }}><span>{l}</span><span>{v}</span></div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', fontStyle: 'italic' }}>Total</span>
                  <div style={{ border: '1px solid #cbd5e1', padding: '3px 10px', fontWeight: 700, fontSize: 11, color: '#0f172a' }}>$13,931.93</div>
                </div>
                {[['Deposit Due (50%)', '$6,965.97'], ['Remaining Balance', '$6,965.96']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#334155', padding: '2px 0' }}><span>{l}</span><span>{v}</span></div>
                ))}
              </div>
            </div>

            {/* INCLUSIONS / EXCLUSIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 24px 12px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Inclusions</p>
                <p style={{ fontSize: 9, color: '#334155', lineHeight: 1.45, margin: 0 }}>Supply & install flooring, transitions, quarter round, subfloor prep, stairs, removal of existing material.</p>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 8, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Exclusions</p>
                <p style={{ fontSize: 9, color: '#334155', lineHeight: 1.45, margin: 0 }}>Painting, baseboards, appliance moving, or work outside the scope above. Customer to remove personal items.</p>
              </div>
            </div>

            {/* FOOTER BAR */}
            <div style={{ background: '#1e293b', padding: '8px 24px', textAlign: 'center' }}>
              <p style={{ color: 'white', fontSize: 9, margin: 0 }}>
                Questions? Contact <b>info@premierfloors.com</b> or <b>(312) 555-0182</b>
              </p>
            </div>
          </div>

          {/* Download badge */}
          <div className="absolute flex items-center gap-2 bg-white rounded-2xl px-3 py-2 shadow-xl" style={{ border: '1px solid #e2e8f0', bottom: -16, right: -8 }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.1)' }}>
              <svg className="w-3 h-3" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Download PDF</p>
              <p className="text-[10px] text-gray-400">One tap. Instant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="rounded-3xl px-6 py-14 sm:px-12 sm:py-20 text-center" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', border: '1px solid #99f6e4' }}>
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="FloorQuote Pro" width={60} height={60} className="rounded-2xl shadow-lg" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Start estimating like a pro</h2>
          <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Flooring contractors use FloorQuote Pro to finish their take-offs faster, send better-looking estimates, and close more jobs.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-base"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(13,148,136,0.35)' }}
          >
            Create Your Free Account
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="text-sm text-gray-400 mt-4">No credit card. 3 free estimates to start.</p>
        </div>
      </section>

    </main>
  )
}
