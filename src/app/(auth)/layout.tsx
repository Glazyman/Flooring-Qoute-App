import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="FloorQuote Pro" width={56} height={56} className="rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>FloorQuote Pro</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Professional estimates in under 2 minutes</p>
        </div>
        <div className="rounded-2xl p-8" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
