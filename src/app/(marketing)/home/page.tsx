import Link from 'next/link'
import Image from 'next/image'
import PricingSection from '@/components/PricingSection'

const STEPS = [
  {
    n: '1',
    title: 'Enter customer & measurements',
    desc: 'Add room dimensions by hand or upload a blueprint photo — AI reads it for you.',
  },
  {
    n: '2',
    title: 'Set your pricing',
    desc: 'Material cost, labor, extras, tax, and markup are auto-calculated live as you type.',
  },
  {
    n: '3',
    title: 'Download & send the PDF',
    desc: 'A branded estimate with your logo and deposit terms — ready in under 2 minutes.',
  },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'Quotes in Under 2 Min',
    desc: 'Fill rooms, pick materials, and generate a professional PDF faster than any spreadsheet.',
  },
  {
    icon: '🤖',
    title: 'AI Blueprint Reading',
    desc: 'Snap a photo of a floor plan — AI extracts every room\'s dimensions automatically.',
  },
  {
    icon: '📄',
    title: 'Professional PDF',
    desc: 'Branded with your logo and contact info, with an itemized breakdown and deposit terms.',
  },
  {
    icon: '📱',
    title: 'Mobile-First',
    desc: 'Built for the jobsite. Large tap targets and numeric keyboards on every phone.',
  },
  {
    icon: '📊',
    title: 'Track Every Job',
    desc: 'Dashboard shows pipeline revenue, accepted vs pending quotes at a glance.',
  },
  {
    icon: '⚙️',
    title: 'Your Defaults, Saved',
    desc: 'Set labor rate, markup, and deposit once — every new quote starts pre-filled.',
  },
]

export default function HomePage() {
  return (
    <main className="marketing-page">

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
          FloorQuote Pro lets flooring contractors quote fast, look professional, and win more jobs — from any phone or computer.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 text-white font-bold px-7 py-4 rounded-2xl text-base"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(13,148,136,0.3)' }}
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

      {/* ── App mockup ── */}
      <section className="max-w-4xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left — quote info */}
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

            {/* Right — live estimate */}
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

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>How it works</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Three steps to a winning quote</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map(({ n, title, desc }) => (
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

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Features</p>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Everything a flooring pro needs</h2>
          <p className="text-base sm:text-lg text-gray-400 mt-3 max-w-xl mx-auto">No complicated software. No training. Just fast, accurate quotes.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl sm:rounded-xl border border-gray-100 p-4 sm:p-6" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="text-2xl mb-3">{icon}</div>
              <h3 className="font-bold text-gray-900 mb-1 text-[13px] sm:text-[15px]">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-5 mb-16 sm:mb-24">
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-12 sm:px-8 sm:py-16 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="FloorQuote Pro" width={56} height={56} className="rounded-2xl" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Ready to quote faster?</h2>
          <p className="text-base sm:text-lg text-gray-400 mb-8 max-w-lg mx-auto">Join flooring contractors already using FloorQuote Pro to win more jobs.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-base"
            style={{ background: 'var(--primary)', boxShadow: '0 4px 20px rgba(13,148,136,0.3)' }}
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
