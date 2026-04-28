import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="FloorQuote Pro"
            width={56}
            height={56}
            className="rounded-2xl mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-violet-600">FloorQuote Pro</h1>
          <p className="text-sm text-gray-400 mt-1">Professional estimates in under 2 minutes</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
