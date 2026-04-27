'use client'

import { useEffect, useState } from 'react'

interface ProviderStatus {
  connected: boolean
  email: string | null
}

interface ConnectionStatus {
  gmail: ProviderStatus
  outlook: ProviderStatus
}

function GmailIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#fff" stroke="#e5e7eb" />
      <path d="M6 10.5v11A1.5 1.5 0 0 0 7.5 23h17A1.5 1.5 0 0 0 26 21.5v-11L16 17 6 10.5z" fill="#EA4335" />
      <path d="M6 10.5L16 17l10-6.5" stroke="#EA4335" strokeWidth="0" />
      <path d="M6 10.5h20L16 17 6 10.5z" fill="#FBBC04" />
      <path d="M6 10.5h20" stroke="#34A853" strokeWidth="0" />
      <path d="M6 10.5v1l10 6.5 10-6.5v-1H6z" fill="#4285F4" />
      <path d="M7.5 9h17A1.5 1.5 0 0 1 26 10.5L16 17 6 10.5A1.5 1.5 0 0 1 7.5 9z" fill="#EA4335" />
      <text x="16" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">M</text>
    </svg>
  )
}

function OutlookIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="#0078D4" />
      <rect x="6" y="9" width="14" height="14" rx="2" fill="#fff" />
      <path d="M13 12.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="#0078D4" />
      <rect x="20" y="13" width="6" height="9" rx="1" fill="#50D9FF" opacity="0.9" />
      <path d="M20 15.5l3 2 3-2" stroke="white" strokeWidth="1" fill="none" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#22c55e" />
      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface ProviderCardProps {
  name: string
  icon: React.ReactNode
  provider: 'gmail' | 'outlook'
  status: ProviderStatus
  onDisconnect: (provider: 'gmail' | 'outlook') => void
  disconnecting: boolean
}

function ProviderCard({ name, icon, provider, status, onDisconnect, disconnecting }: ProviderCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-semibold text-gray-900">{name}</span>
        {status.connected && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckIcon />
            Connected
          </span>
        )}
      </div>

      {status.connected && status.email ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 truncate">
            Sending as <span className="font-medium text-gray-700">{status.email}</span>
          </p>
          <button
            onClick={() => onDisconnect(provider)}
            disabled={disconnecting}
            className="self-start rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            Send quote emails directly from your {name} address.
          </p>
          <a
            href={`/api/auth/${provider}`}
            className="self-start rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Connect {name}
          </a>
        </div>
      )}
    </div>
  )
}

export default function EmailConnectionSection() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<'gmail' | 'outlook' | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/email-connection/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Check for connection success/error in URL params
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')
    const error = params.get('error')
    if (connected) {
      setFlash(`${connected === 'gmail' ? 'Gmail' : 'Outlook'} connected successfully!`)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      setFlash(`Connection failed: ${error.replace(/_/g, ' ')}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleDisconnect = async (provider: 'gmail' | 'outlook') => {
    setDisconnecting(provider)
    try {
      const res = await fetch(`/api/auth/email-connection?provider=${provider}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setStatus((prev) =>
          prev
            ? { ...prev, [provider]: { connected: false, email: null } }
            : prev
        )
        setFlash(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} disconnected.`)
      }
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Email Sending</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Connect your email account to send quotes directly from your own address.
        </p>
      </div>

      {flash && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            flash.includes('failed') || flash.includes('error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {flash}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ProviderCard
            name="Gmail"
            icon={<GmailIcon />}
            provider="gmail"
            status={status?.gmail ?? { connected: false, email: null }}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting === 'gmail'}
          />
          <ProviderCard
            name="Outlook"
            icon={<OutlookIcon />}
            provider="outlook"
            status={status?.outlook ?? { connected: false, email: null }}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting === 'outlook'}
          />
        </div>
      )}

      <p className="text-xs text-gray-400">
        If no account is connected, quotes are sent via Resend (if configured) or email is disabled.
      </p>
    </div>
  )
}
