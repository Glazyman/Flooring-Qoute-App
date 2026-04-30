'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Upload, Loader2, Plus, Trash2, ChevronRight, AlertCircle,
  Info, ScanLine, Save, BookOpen, X, Check, FolderOpen,
} from 'lucide-react'

interface Room {
  name: string
  section: string
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
  sqft: number
}

interface SavedCalc {
  id: string
  name: string
  rooms: Room[]
  waste_pct: number
  total_sqft: number
  created_at: string
}

function roomSqft(r: Room) {
  return parseFloat(((r.lengthFt + r.lengthIn / 12) * (r.widthFt + r.widthIn / 12)).toFixed(1))
}

function dimLabel(ft: number, inches: number) {
  return inches > 0 ? `${ft}' ${inches}"` : `${ft}'`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TakeOffCalculator({ isPro }: { isPro: boolean }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // Current working state
  const [rooms, setRooms] = useState<Room[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wastePct, setWastePct] = useState(10)

  // Save flow
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Saved calculations list
  const [savedCalcs, setSavedCalcs] = useState<SavedCalc[]>([])
  const [showSaved, setShowSaved] = useState(false)
  const [loadingCalcs, setLoadingCalcs] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalRaw = rooms.reduce((s, r) => s + roomSqft(r), 0)
  const totalWithWaste = totalRaw * (1 + wastePct / 100)
  const hasRooms = rooms.length > 0
  const sections = Array.from(new Set(rooms.map(r => r.section)))

  const fetchSaved = useCallback(async () => {
    setLoadingCalcs(true)
    try {
      const res = await fetch('/api/takeoff-calculations')
      const data = await res.json()
      setSavedCalcs(data.calculations ?? [])
    } catch {
      // ignore
    }
    setLoadingCalcs(false)
  }, [])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setLoading(true)
    setError('')

    const allRooms: Room[] = []
    const allNotes: string[] = []
    const errors: string[] = []

    for (const file of files) {
      const fd = new FormData()
      fd.append('image', file)
      try {
        const res = await fetch('/api/quotes/blueprint', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { errors.push(`${file.name}: ${data.error || 'Analysis failed'}`); continue }
        const extracted: Room[] = (data.rooms || []).map((r: {
          name: string; section: string
          lengthFt: number; lengthIn: number; widthFt: number; widthIn: number
        }) => ({
          name: r.name || '', section: r.section || 'Main Floor',
          lengthFt: r.lengthFt || 0, lengthIn: r.lengthIn || 0,
          widthFt: r.widthFt || 0, widthIn: r.widthIn || 0, sqft: 0,
        })).map((r: Room) => ({ ...r, sqft: roomSqft(r) }))
        allRooms.push(...extracted)
        if (data.notes) allNotes.push(data.notes)
      } catch { errors.push(`${file.name}: Failed to analyze`) }
    }

    if (errors.length) setError(errors.join(' · '))
    if (allRooms.length) {
      setRooms(prev => prev.length ? [...prev, ...allRooms] : allRooms)
      if (allNotes.length) setNotes(prev => [prev, ...allNotes].filter(Boolean).join('\n'))
    }
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeRoom(idx: number) {
    setRooms(prev => prev.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setRooms([])
    setNotes('')
    setError('')
    setSaveSuccess(false)
  }

  function startEstimate() {
    if (!rooms.length) return
    sessionStorage.setItem('takeoff_rooms', JSON.stringify(rooms))
    router.push('/quotes/new')
  }

  async function handleSave() {
    if (!saveName.trim() || !rooms.length) return
    setSaving(true)
    try {
      const res = await fetch('/api/takeoff-calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName.trim(),
          rooms,
          waste_pct: wastePct,
          total_sqft: parseFloat(Math.ceil(totalWithWaste).toFixed(1)),
        }),
      })
      const data = await res.json()
      if (data.calculation) {
        setSavedCalcs(prev => [data.calculation, ...prev])
        setShowSaveModal(false)
        setSaveName('')
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      // ignore
    }
    setSaving(false)
  }

  function loadCalc(calc: SavedCalc) {
    setRooms(calc.rooms)
    setWastePct(calc.waste_pct)
    setShowSaved(false)
    setNotes('')
    setError('')
    setSaveSuccess(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteCalc(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/takeoff-calculations/${id}`, { method: 'DELETE' })
      setSavedCalcs(prev => prev.filter(c => c.id !== id))
    } catch {
      // ignore
    }
    setDeletingId(null)
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Save take-off</h2>
              <button onClick={() => setShowSaveModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">Give this take-off a name so you can find it later.</p>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Smith Residence – Main Floor"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 mb-4"
              style={{ focusRingColor: 'var(--primary)' } as React.CSSProperties}
            />
            <div className="text-xs text-gray-400 mb-5 bg-gray-50 rounded-xl px-4 py-3 space-y-1">
              <p><span className="font-semibold text-gray-600">{rooms.length} rooms</span> across {sections.length} area{sections.length !== 1 ? 's' : ''}</p>
              <p><span className="font-semibold text-gray-600">{Math.ceil(totalWithWaste)} sqft</span> total with {wastePct}% waste</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!saveName.trim() || saving}
                className="flex-1 text-white font-semibold py-2.5 rounded-xl text-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--primary)' }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved calculations drawer */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="ml-auto w-full max-w-sm h-full bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Saved take-offs</h2>
              <button onClick={() => setShowSaved(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingCalcs ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                </div>
              ) : savedCalcs.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(13,148,136,0.08)' }}>
                    <FolderOpen className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">No saved take-offs yet</p>
                  <p className="text-xs text-gray-400">After uploading a blueprint, tap Save to store the calculation here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {savedCalcs.map(calc => (
                    <div key={calc.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => loadCalc(calc)}
                          className="flex-1 text-left min-w-0"
                        >
                          <p className="text-sm font-semibold text-gray-900 truncate">{calc.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{calc.rooms.length} rooms · {Math.ceil(calc.total_sqft)} sqft · {formatDate(calc.created_at)}</p>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => loadCalc(calc)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--primary)', background: 'rgba(13,148,136,0.08)' }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteCalc(calc.id)}
                            disabled={deletingId === calc.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deletingId === calc.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.1)' }}>
            <ScanLine className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Take-Off Calculator</h1>
            <p className="text-xs text-gray-400 mt-0.5">Upload a blueprint to extract room dimensions with AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => { setShowSaved(true); fetchSaved() }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Saved
            {savedCalcs.length > 0 && (
              <span className="w-4 h-4 rounded-full text-white flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--primary)' }}>
                {savedCalcs.length > 9 ? '9+' : savedCalcs.length}
              </span>
            )}
          </button>
          {hasRooms && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5 px-2 py-1.5"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Save success toast */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(13,148,136,0.1)', color: 'var(--primary)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <Check className="w-4 h-4 flex-shrink-0" />
          Take-off saved successfully
        </div>
      )}

      {/* Upload zone */}
      {isPro ? (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <div
            onClick={() => !loading && fileRef.current?.click()}
            className="rounded-2xl transition-all"
            style={{
              border: '2px dashed',
              borderColor: loading ? 'var(--primary)' : '#d1d5db',
              background: loading ? 'rgba(13,148,136,0.03)' : 'white',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Analyzing blueprint with AI</p>
                  <p className="text-xs text-gray-400 mt-1">Usually 10 to 20 seconds per image</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ color: 'var(--primary)', background: 'rgba(13,148,136,0.08)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                  Reading room dimensions
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.08)' }}>
                  <Upload className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {hasRooms ? 'Upload another page' : 'Upload your blueprint or floor plan'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, or HEIC — upload multiple images for multi-floor jobs</p>
                </div>
                <span className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: 'var(--primary)' }}>
                  Choose file
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <Link
          href="/billing/setup"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 transition-colors hover:bg-gray-50"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.08)' }}>
            <ScanLine className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              AI Blueprint Take-Off
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--primary)', background: 'rgba(13,148,136,0.08)' }}>Pro</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Upgrade to Pro to upload floor plans and extract room dimensions automatically</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </Link>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 px-4 py-3.5 rounded-xl text-sm" style={{ border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Notes from image */}
      {notes && (
        <div className="flex items-start gap-2.5 bg-amber-50 text-amber-800 px-4 py-3.5 rounded-xl text-sm" style={{ border: '1px solid #fde68a' }}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Notes from blueprint</p>
            <p className="text-xs leading-relaxed whitespace-pre-line">{notes}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {hasRooms && (
        <>
          {/* Waste factor */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Waste factor</p>
              <p className="text-xs text-gray-400 mt-0.5">Extra material for cuts and waste</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 20].map(p => (
                <button
                  key={p}
                  onClick={() => setWastePct(p)}
                  className="text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  style={wastePct === p
                    ? { background: 'var(--primary)', color: 'white', boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }
                    : { background: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Rooms by section */}
          <div className="space-y-3">
            {sections.map(section => {
              const sectionRooms = rooms.filter(r => r.section === section)
              const sectionTotal = sectionRooms.reduce((s, r) => s + roomSqft(r), 0)
              return (
                <div key={section} className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50" style={{ background: '#fafafa' }}>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{section}</p>
                    <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--primary)' }}>{sectionTotal.toFixed(1)} sqft</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {sectionRooms.map((room, idx) => {
                      const globalIdx = rooms.indexOf(room)
                      return (
                        <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-400" style={{ background: '#f3f4f6' }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{room.name || 'Room'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {dimLabel(room.lengthFt, room.lengthIn)} × {dimLabel(room.widthFt, room.widthIn)}
                            </p>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-gray-900 shrink-0">{roomSqft(room).toFixed(1)} sqft</p>
                          <button onClick={() => removeRoom(globalIdx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
            <div className="divide-y divide-white/10">
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm text-teal-100">Measured area</p>
                <p className="text-sm font-semibold text-white tabular-nums">{totalRaw.toFixed(1)} sqft</p>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm text-teal-100">Waste ({wastePct}%)</p>
                <p className="text-sm font-semibold text-white tabular-nums">+{(totalWithWaste - totalRaw).toFixed(1)} sqft</p>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider mb-0.5">Order quantity</p>
                  <p className="text-xs text-teal-200">Amount to order with waste included</p>
                </div>
                <p className="text-3xl font-extrabold text-white tabular-nums">
                  {Math.ceil(totalWithWaste)}<span className="text-lg font-semibold text-teal-200 ml-1">sqft</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startEstimate}
              className="flex-1 inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-3.5 rounded-xl text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--button-dark)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              <Plus className="w-4 h-4" />
              Start Estimate with These Rooms
            </button>
            <button
              onClick={() => { setSaveName(''); setShowSaveModal(true) }}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-5 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Take-Off
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading || !isPro}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium px-4 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Add Floor
            </button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !hasRooms && isPro && (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">Upload a blueprint above and AI will extract every room.</p>
          <p className="text-xs text-gray-300 mt-1">You can also enter rooms manually when starting a new project.</p>
        </div>
      )}
    </div>
  )
}
