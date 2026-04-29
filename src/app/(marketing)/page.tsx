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
    title: 'Auto-calculated estimates',
    desc: 'Material, labor, waste, markup, tax, and deposit — all computed live as you type. Zero math.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Branded PDF in one tap',
    desc: 'Your logo, contact info, line-item breakdown, deposit terms, and validity date — download-ready instantly.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Works on any phone',
    desc: 'Built for the jobsite. Large tap targets, numeric keyboards, and full offline-friendly drafts.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'Multi-room & multi-section',
    desc: 'Add unlimited rooms across sections — hardwood upstairs, LVT in the basement, tile in the kitchen. One quote.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Job scope checklist',
    desc: 'Check off finish type, sanding system, removal, transitions, and installs — so nothing gets forgotten on the quote.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Every extra included',
    desc: 'Stairs, quarter round, transitions, underlayment, disposal, furniture moving — each line-item priced and totalled.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Pipeline dashboard',
    desc: 'See all your measurements, pending estimates, accepted jobs, and total revenue at a glance.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Duplicate any quote',
    desc: 'Repeat customer? Similar job? Clone an existing estimate in one tap and adjust only what changed.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Your defaults, saved',
    desc: 'Set your rates, markup, deposit %, and waste once — every new project starts pre-filled.',
  },
]

const PAIN_POINTS = [
  { before: 'Scribbling numbers on a napkin', after: 'Structured digital quote in 2 min' },
  { before: 'Forgot to add stairs or disposal', after: 'Every extra has its own line item' },
  { before: 'Emailing a blurry spreadsheet', after: 'Clean branded PDF with your logo' },
  { before: 'Losing track of which jobs you quoted', after: 'Dashboard shows your full pipeline' },
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
          3 free quotes — no credit card needed
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-5 sm:mb-6">
          Floor estimates.<br />
          <span style={{ color: 'var(--primary)' }}>Done in 2 minutes.</span>
        </h1>

        <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
          FloorQuote Pro lets flooring contractors quote fast, look professional, and win more jobs — straight from your phone on the jobsite.
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
        <p className="text-sm text-gray-400">No credit card · Cancel anytime</p>
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
                { label: 'Flooring', value: 'Hardwood · Red Oak' },
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
                Snap a blueprint.<br />Get your measurements.
              </h2>
              <p className="text-teal-100 text-base sm:text-lg leading-relaxed mb-8">
                Walk into a job, take a photo of the floor plan, and our AI reads every room&apos;s dimensions automatically. No tape measure. No manual entry. No mistakes.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Works on any phone camera',
                  'Reads handwritten & printed plans',
                  'Rooms populate instantly into your quote',
                  'Review and edit before saving',
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
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Stop quoting the old way</h2>
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
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Three steps to a winning quote</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: '1', title: 'Enter customer & measurements', desc: 'Add room dimensions by hand or upload a blueprint photo — AI reads it for you.' },
            { n: '2', title: 'Set your pricing', desc: 'Material cost, labor, extras, tax, and markup are auto-calculated live as you type.' },
            { n: '3', title: 'Download & send the PDF', desc: 'A branded estimate with your logo and deposit terms — ready in under 2 minutes.' },
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
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Everything a flooring pro needs</h2>
          <p className="text-base sm:text-lg text-gray-400 mt-3 max-w-xl mx-auto">No complicated software. No training. Just fast, accurate quotes.</p>
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
            A branded, itemized PDF — ready to email or print on the spot.
          </p>
        </div>

        {/* Paper document */}
        <div className="relative mx-auto" style={{ maxWidth: 720 }}>
          {/* Drop shadow layers for depth */}
          <div className="absolute inset-0 translate-y-3 translate-x-2 rounded-lg opacity-10" style={{ background: '#1e293b', filter: 'blur(12px)' }} />
          <div className="relative bg-white rounded-lg overflow-hidden text-[10px] sm:text-[11px] leading-snug" style={{ border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>

            {/* ── HEADER: logo + company info (left) · title + meta (right) ── */}
            <div className="flex justify-between items-start gap-4 px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
              {/* Left: company */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-md flex-shrink-0 flex items-center justify-center text-white font-extrabold text-base" style={{ background: 'var(--primary)' }}>
                  FP
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">Premier Flooring Solutions</p>
                  <p className="text-gray-500 text-[10px] mt-0.5">123 Trade Street, Suite 4</p>
                  <p className="text-gray-500 text-[10px]">Chicago, IL 60601</p>
                  <p className="text-gray-500 text-[10px]"><span className="font-semibold text-gray-700">Office:</span> (312) 555-0182</p>
                  <p className="text-gray-500 text-[10px]"><span className="font-semibold text-gray-700">Email:</span> info@premierfloors.com</p>
                </div>
              </div>
              {/* Right: title */}
              <div className="text-right flex-shrink-0">
                <p className="font-extrabold leading-none" style={{ fontSize: 28, color: '#1e293b' }}>Flooring</p>
                <p className="font-bold text-gray-400" style={{ fontSize: 14 }}>Estimate</p>
                <div className="mt-2 space-y-0.5">
                  {[
                    { label: 'Estimate Date:', value: 'Apr 29, 2026' },
                    { label: 'Estimate #:', value: 'EST-1042' },
                    { label: 'Valid For:', value: '30 days' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-end gap-1.5" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 2 }}>
                      <span className="font-semibold text-gray-800 text-[10px]">{label}</span>
                      <span className="text-gray-500 text-[10px]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── CLIENT + PROJECT BOXES ── */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4">
              <div className="rounded-lg p-3" style={{ border: '1px solid #e2e8f0' }}>
                <p className="font-bold text-gray-800 text-[11px] mb-2">Client Information:</p>
                {[
                  { l: 'Name:', v: 'John & Sarah Williams' },
                  { l: 'Address:', v: '274 Cornwall Rd, Naperville IL' },
                  { l: 'Phone:', v: '(630) 555-0194' },
                  { l: 'Email:', v: 'jwilliams@email.com' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex gap-2 mb-1">
                    <span className="font-semibold text-gray-700 text-[10px] w-14 flex-shrink-0">{l}</span>
                    <span className="text-gray-600 text-[10px]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg p-3" style={{ border: '1px solid #e2e8f0' }}>
                <p className="font-bold text-gray-800 text-[11px] mb-2">Project Details:</p>
                {[
                  { l: 'Flooring:', v: 'Hardwood + LVT' },
                  { l: 'Main Floor:', v: 'Hardwood — 892 sqft' },
                  { l: 'Basement:', v: 'LVT/Vinyl — 410 sqft' },
                  { l: 'Color/Style:', v: 'Natural Oak, Matte finish' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex gap-2 mb-1">
                    <span className="font-semibold text-gray-700 text-[10px] w-16 flex-shrink-0">{l}</span>
                    <span className="text-gray-600 text-[10px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── COST BREAKDOWN TABLE ── */}
            <div className="px-6 pb-4">
              <p className="font-bold text-[11px] mb-1.5" style={{ color: '#1e293b' }}>Cost Breakdown</p>
              <div className="rounded" style={{ border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                {/* Table header */}
                <div className="grid text-white font-semibold text-[10px] px-3 py-2" style={{ gridTemplateColumns: '46% 13% 11% 14% 16%', background: '#1e293b' }}>
                  <span>Item Description</span>
                  <span className="text-right">Quantity</span>
                  <span className="text-right">UoM</span>
                  <span className="text-right">Unit Price</span>
                  <span className="text-right">Total</span>
                </div>
                {/* Rows */}
                {[
                  { desc: 'Main Floor: supply Hardwood', qty: '981.2', uom: 'SF', rate: '$5.20', total: '$5,102.24' },
                  { desc: 'Main Floor: labor / installation', qty: '981.2', uom: 'SF', rate: '$3.50', total: '$3,434.20' },
                  { desc: 'Basement: supply LVT/Vinyl', qty: '451.0', uom: 'SF', rate: '$3.80', total: '$1,713.80' },
                  { desc: 'Basement: labor / installation', qty: '451.0', uom: 'SF', rate: '$2.75', total: '$1,240.25' },
                  { desc: 'Removal of existing flooring', qty: '', uom: 'LS', rate: '$450.00', total: '$450.00' },
                  { desc: 'Stairs (12)', qty: '12', uom: 'EA', rate: '$35.00', total: '$420.00' },
                  { desc: 'Quarter round / moldings', qty: '', uom: 'LS', rate: '$280.00', total: '$280.00' },
                  { desc: 'Subfloor prep', qty: '', uom: 'LS', rate: '$200.00', total: '$200.00' },
                ].map((row, i) => (
                  <div key={i} className="grid px-3 py-1.5 text-gray-700 text-[10px]" style={{ gridTemplateColumns: '46% 13% 11% 14% 16%', borderBottom: '0.5px solid #e2e8f0' }}>
                    <span className="text-gray-800">{row.desc}</span>
                    <span className="text-right">{row.qty}</span>
                    <span className="text-right text-gray-500">{row.uom}</span>
                    <span className="text-right">{row.rate}</span>
                    <span className="text-right font-semibold">{row.total}</span>
                  </div>
                ))}
                {/* Signature area */}
                <div className="px-3 py-3" style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                  <p className="font-bold text-gray-700 text-[10px] mb-0.5">READ CAREFULLY — SIGN &amp; EMAIL BACK</p>
                  <p className="text-gray-500 text-[9px] mb-3">You are authorized to do work as is specified above.</p>
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <div style={{ borderBottom: '1px solid #374151', height: 16, marginBottom: 2 }} />
                      <p className="text-gray-400 text-[8px] uppercase tracking-wide">Authorized Signature</p>
                    </div>
                    <div style={{ width: 100 }}>
                      <div style={{ borderBottom: '1px solid #374151', height: 16, marginBottom: 2 }} />
                      <p className="text-gray-400 text-[8px] uppercase tracking-wide">Date</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── BOTTOM ROW: notes (left) + totals (right) ── */}
            <div className="grid grid-cols-2 gap-4 px-6 pb-5">
              {/* Left: scope */}
              <div>
                <p className="text-gray-700 text-[10px] leading-relaxed mb-2">
                  Work includes full prep of subfloor, installation, all transitions, and final cleanup. All material and labor warranted for 1 year against defects.
                </p>
                <p className="text-gray-400 text-[9px] leading-relaxed italic">
                  Prices subject to change without notice after 30 days. A 50% deposit is required to schedule. Balance due upon completion.
                </p>
              </div>
              {/* Right: totals */}
              <div>
                {[
                  { l: 'Subtotal', v: '$12,840.49' },
                  { l: 'Tax (8.5%)', v: '$1,091.44' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between py-1 text-[10px] text-gray-700">
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center my-2">
                  <span className="font-bold text-gray-900 text-sm italic">Total</span>
                  <div className="px-3 py-1 font-bold text-gray-900 text-xs" style={{ border: '1px solid #cbd5e1', minWidth: 90, textAlign: 'right' }}>$13,931.93</div>
                </div>
                {[
                  { l: 'Deposit Due (50%)', v: '$6,965.97' },
                  { l: 'Remaining Balance', v: '$6,965.96' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between py-1 text-[10px] text-gray-700">
                    <span>{l}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── INCLUSIONS / EXCLUSIONS ── */}
            <div className="px-6 pb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-500 text-[9px] uppercase tracking-widest mb-1">Inclusions</p>
                <p className="text-gray-700 text-[10px] leading-relaxed">Supply & install all flooring materials, transitions, quarter round, subfloor prep, stairs, and removal of existing flooring.</p>
              </div>
              <div>
                <p className="font-bold text-gray-500 text-[9px] uppercase tracking-widest mb-1">Exclusions</p>
                <p className="text-gray-700 text-[10px] leading-relaxed">Painting, baseboards, appliance moving, or any work outside the scope above.</p>
              </div>
            </div>

            {/* ── FOOTER BAR ── */}
            <div className="px-6 py-2.5 text-center" style={{ background: '#1e293b' }}>
              <p className="text-white text-[10px]">
                For any questions, contact: <span className="font-bold">info@premierfloors.com</span> or <span className="font-bold">(312) 555-0182</span>
              </p>
            </div>
          </div>

          {/* Download badge overlay */}
          <div className="absolute -bottom-4 -right-2 sm:-right-6 flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-xl" style={{ border: '1px solid #e2e8f0' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
              <svg className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Download PDF</p>
              <p className="text-[10px] text-gray-400">One tap · Instant</p>
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
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Ready to quote faster?</h2>
          <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Join flooring contractors already using FloorQuote Pro to close more jobs and spend less time on paperwork.
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
          <p className="text-sm text-gray-400 mt-4">No credit card · 3 free quotes to start</p>
        </div>
      </section>

    </main>
  )
}
