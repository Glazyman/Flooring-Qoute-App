'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileEdit, Plus, Trash2 } from 'lucide-react'
import { fmt } from '@/lib/calculations'
import { flooringTypeLabel } from '@/lib/flooringLabels'

interface Draft {
  id: string
  customer_name: string | null
  customer_phone: string | null
  job_address: string | null
  flooring_type: string | null
  section_flooring_types: Record<string, string> | null
  adjusted_sqft: number
  final_total: number
  created_at: string
}

export default function DraftsClient({ initialDrafts }: { initialDrafts: Draft[] }) {
  const router = useRouter()
  const [drafts, setDrafts] = useState(initialDrafts)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [working, setWorking] = useState(false)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const allIds = drafts.map(d => d.id)
    const allSelected = allIds.every(id => selected.has(id))
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  async function bulkDelete() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    ))
    setDrafts(prev => prev.filter(d => !selected.has(d.id)))
    setSelected(new Set())
    setSelectMode(false)
    setConfirmDelete(false)
    setWorking(false)
    router.refresh()
  }

  const allSelected = drafts.length > 0 && drafts.every(d => selected.has(d.id))
  const selCount = selected.size

  return (
    <div className="space-y-5">
      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Delete {selCount} draft{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm font-medium px-3 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={working}
                className="text-sm font-medium px-3.5 py-2 rounded-md text-white transition-colors disabled:opacity-50"
                style={{ background: 'var(--danger)' }}
              >
                {working ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-base font-semibold text-gray-900">Drafts</h1>
        <Link
          href="/quotes/new"
          className="lg:hidden inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-2xl text-white flex-shrink-0"
          style={{ background: 'var(--button-dark)' }}
        >
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {drafts.length === 0 ? (
          <div className="py-20 text-center">
            <FileEdit className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-1">No drafts yet</p>
            <p className="text-xs text-gray-400">Quotes you start but don&apos;t submit are saved here automatically.</p>
          </div>
        ) : (
          <div>
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid #F5F5F7' }}>
              {!selectMode ? (
                <button
                  onClick={() => setSelectMode(true)}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Select
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold transition-colors"
                    style={{ color: 'var(--primary)' }}
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                  <span className="text-xs text-gray-300">·</span>
                  <button
                    onClick={exitSelectMode}
                    className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Bulk action bar */}
            {selCount > 0 && (
              <div
                className="flex items-center gap-3 px-4 py-2"
                style={{ background: '#FFF5F5', borderBottom: '1px solid #FEE2E2' }}
              >
                <span className="text-xs text-gray-600">{selCount} selected</span>
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={working}
                  className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
                <button
                  onClick={exitSelectMode}
                  className="text-xs text-gray-400 hover:text-gray-600 ml-auto transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Rows */}
            {drafts.map((q, i) => {
              const date = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const initials = (q.customer_name || '?').charAt(0).toUpperCase()
              const typeLabel = flooringTypeLabel(q.flooring_type as string, q.section_flooring_types)
              const isLast = i === drafts.length - 1
              const isSelected = selected.has(q.id)

              const rowContent = (
                <>
                  {selectMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(q.id)}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 flex-shrink-0 cursor-pointer rounded"
                      style={{ accentColor: '#1C1C1E' }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0"
                    style={{ background: '#F1F1F4' }}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {q.customer_name || <span className="text-gray-400 italic">Unnamed</span>}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {[typeLabel, q.job_address].filter(Boolean).join(' · ') || 'No details yet'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-xs text-gray-400">{date}</p>
                    {q.adjusted_sqft > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">{Math.round(q.adjusted_sqft).toLocaleString()} sqft</p>
                    )}
                  </div>
                  {!selectMode && (
                    <div className="flex-shrink-0">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#F1F1F4', color: '#6e6e73' }}
                      >
                        <FileEdit className="w-3 h-3" />
                        Continue
                      </span>
                    </div>
                  )}
                </>
              )

              return selectMode ? (
                <div
                  key={q.id}
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                  style={{
                    borderBottom: isLast ? 'none' : '1px solid #F5F5F7',
                    background: isSelected ? 'rgba(239,246,255,0.4)' : undefined,
                  }}
                  onClick={() => toggleSelect(q.id)}
                >
                  {rowContent}
                </div>
              ) : (
                <Link
                  key={q.id}
                  href={`/quotes/${q.id}/edit`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                  style={{ borderBottom: isLast ? 'none' : '1px solid #F5F5F7', textDecoration: 'none' }}
                >
                  {rowContent}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
