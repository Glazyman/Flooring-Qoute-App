'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ruler, Plus, Square, CheckSquare } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import type { Quote } from '@/lib/types'
import ApproveMeasurementButton from '@/components/ApproveMeasurementButton'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MeasurementsClient({ initialMeasurements }: { initialMeasurements: Quote[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialMeasurements)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === items.length ? new Set() : new Set(items.map(i => i.id)))
  }

  function exitSelect() {
    setSelecting(false)
    setSelected(new Set())
  }

  async function bulkApprove() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      })
    ))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    exitSelect()
    setWorking(false)
    router.refresh()
  }

  async function bulkDelete() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    ))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    exitSelect()
    setConfirmDelete(false)
    setWorking(false)
    router.refresh()
  }

  const selCount = selected.size
  const allSelected = items.length > 0 && selected.size === items.length

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Confirm bulk delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>
              Delete {selCount} measurement{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border font-semibold text-sm py-3 rounded-2xl"
                style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={working}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-2xl disabled:opacity-50"
              >
                {working ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Saved Measurements</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {items.length} measurement{items.length !== 1 ? 's' : ''} — approve to move to Estimates
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {items.length > 0 && (
            <button
              onClick={() => selecting ? exitSelect() : setSelecting(true)}
              className={`text-sm font-semibold px-3.5 py-3 md:py-2.5 rounded-2xl border transition-colors ${
                selecting
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {selecting ? 'Cancel' : 'Select'}
            </button>
          )}
          <Link
            href="/quotes/new"
            className="flex items-center gap-2 text-white font-semibold px-4 py-3 md:py-2.5 rounded-2xl text-sm active:scale-95"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(13,148,136,0.25)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light)' }}>
            <Ruler className="w-7 h-7" style={{ color: 'var(--primary)' }} />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No saved measurements</p>
          <p className="text-sm text-gray-400 mb-5">When you create a new quote, it saves here first.</p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm"
            style={{ background: 'var(--primary)' }}
          >
            <Plus className="w-4 h-4" /> Take Measurements
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Inline select/bulk bar */}
          {selecting && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
              <button onClick={toggleAll} className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
              {selCount > 0 && (
                <>
                  <span className="text-xs text-gray-400 font-medium">{selCount} selected</span>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={bulkApprove}
                      disabled={working}
                      className="text-xs font-medium text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      disabled={working}
                      className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {items.map((m, idx) => {
            const isSelected = selected.has(m.id)
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                style={{
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isSelected ? '#F0FDFA' : undefined,
                }}
              >
                {selecting && (
                  <button onClick={() => toggleSelect(m.id)} className="flex-shrink-0 w-9 h-9 flex items-center justify-center -ml-1.5">
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-teal-600" />
                      : <Square className="w-4 h-4 text-gray-300" />
                    }
                  </button>
                )}

                {selecting ? (
                  <button onClick={() => toggleSelect(m.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{m.customer_name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>
                        {m.flooring_type} · {m.adjusted_sqft.toFixed(0)} sqft · {fmtDate(m.created_at)}
                      </p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--text)' }}>{fmt(m.final_total)}</p>
                  </button>
                ) : (
                  <Link href={`/quotes/${m.id}/edit`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{m.customer_name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-2)' }}>
                        {m.flooring_type} · {m.adjusted_sqft.toFixed(0)} sqft · {fmtDate(m.created_at)}
                        {m.job_address && ` · ${m.job_address}`}
                      </p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0 mr-2" style={{ color: 'var(--text)' }}>{fmt(m.final_total)}</p>
                  </Link>
                )}

                {!selecting && (
                  <div className="flex-shrink-0">
                    <ApproveMeasurementButton
                      quoteId={m.id}
                      onApprove={() => setItems(prev => prev.filter(i => i.id !== m.id))}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
