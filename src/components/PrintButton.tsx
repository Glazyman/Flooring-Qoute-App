'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
      style={{ border: '1px solid #E5E7EB', background: 'white' }}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print
    </button>
  )
}
