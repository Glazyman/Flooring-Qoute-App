'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Upload, Loader2, Plus, Trash2, ChevronRight, AlertCircle,
  Info, ScanLine, Save, BookOpen, X, Check, FolderOpen, Image as ImageIcon, Sparkles,
} from 'lucide-react'

interface Room {
  name: string
  section: string
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
  sqft: number
  pageId?: string
}

type PageStatus = 'idle' | 'analyzing' | 'analyzed' | 'skipped' | 'error'

interface PageEntry {
  id: string
  file: File
  label: string
  thumbUrl: string
  selected: boolean
  status: PageStatus
  rooms: Room[]
  pageType?: string
  errorMsg?: string
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

  // PDF/multi-page picker state
  const [pages, setPages] = useState<PageEntry[]>([])
  const [pdfName, setPdfName] = useState('')
  const [extracting, setExtracting] = useState(false)

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

  async function pdfToPageEntries(file: File): Promise<PageEntry[]> {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const entries: PageEntry[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)

      // Full-resolution analysis image (2x scale)
      const fullViewport = page.getViewport({ scale: 2 })
      const fullCanvas = document.createElement('canvas')
      fullCanvas.width = fullViewport.width
      fullCanvas.height = fullViewport.height
      await page.render({ canvasContext: fullCanvas.getContext('2d')! as unknown as Parameters<typeof page.render>[0]['canvasContext'], viewport: fullViewport }).promise
      const fullBlob = await new Promise<Blob>(r => fullCanvas.toBlob(b => r(b!), 'image/jpeg', 0.85))
      const analysisFile = new File([fullBlob], `${file.name}-page${i}.jpg`, { type: 'image/jpeg' })

      // Thumbnail for the picker
      const thumbViewport = page.getViewport({ scale: 0.4 })
      const thumbCanvas = document.createElement('canvas')
      thumbCanvas.width = thumbViewport.width
      thumbCanvas.height = thumbViewport.height
      await page.render({ canvasContext: thumbCanvas.getContext('2d')! as unknown as Parameters<typeof page.render>[0]['canvasContext'], viewport: thumbViewport }).promise
      const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.7)

      entries.push({
        id: crypto.randomUUID(),
        file: analysisFile,
        label: `Page ${i}`,
        thumbUrl,
        selected: true,
        status: 'idle',
        rooms: [],
      })
    }
    return entries
  }

  async function analyzeFile(file: File): Promise<{ rooms: Room[]; notes: string; error?: string; skipped?: { reason: string } }> {
    const fd = new FormData()
    fd.append('image', file)
    try {
      const res = await fetch('/api/quotes/blueprint', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) return { rooms: [], notes: '', error: data.error || 'Analysis failed' }
      if (data.isFlooringPage === false) {
        return { rooms: [], notes: '', skipped: { reason: data.pageType || 'Not a flooring page' } }
      }
      const rooms: Room[] = (data.rooms || []).map((r: {
        name: string; section: string
        lengthFt: number; lengthIn: number; widthFt: number; widthIn: number
      }) => ({
        name: r.name || '', section: r.section || 'Main Floor',
        lengthFt: r.lengthFt || 0, lengthIn: r.lengthIn || 0,
        widthFt: r.widthFt || 0, widthIn: r.widthIn || 0, sqft: 0,
      })).map((r: Room) => ({ ...r, sqft: roomSqft(r) }))
      return { rooms, notes: data.notes || '' }
    } catch {
      return { rooms: [], notes: '', error: 'Failed to analyze' }
    }
  }

  // Analyze a single page image file directly and add its rooms (no picker)
  async function analyzeAndAppend(filesWithLabels: { file: File; label: string }[]) {
    const allRooms: Room[] = []
    const allNotes: string[] = []
    const errors: string[] = []
    const skipped: string[] = []

    for (const { file, label } of filesWithLabels) {
      const { rooms, notes, error, skipped: skip } = await analyzeFile(file)
      if (error) errors.push(`${label}: ${error}`)
      if (skip) skipped.push(`${label} (${skip.reason})`)
      allRooms.push(...rooms)
      if (notes) allNotes.push(notes)
    }

    const messages: string[] = []
    if (errors.length) messages.push(errors.join(' · '))
    if (skipped.length) messages.push(`Skipped non-flooring: ${skipped.join(', ')}`)
    if (messages.length) setError(messages.join(' · '))

    if (allRooms.length) {
      setRooms(prev => [...prev, ...allRooms])
      if (allNotes.length) setNotes(prev => [prev, ...allNotes].filter(Boolean).join('\n'))
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFiles = Array.from(e.target.files || [])
    if (!rawFiles.length) return
    setError('')

    const pdfs = rawFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    const images = rawFiles.filter(f => !pdfs.includes(f))

    // Single image (no PDF) — analyze immediately, no picker needed
    if (pdfs.length === 0 && images.length > 0) {
      setLoading(true)
      try {
        await analyzeAndAppend(images.map(f => ({ file: f, label: f.name })))
      } finally {
        setLoading(false)
        if (fileRef.current) fileRef.current.value = ''
      }
      return
    }

    // PDF flow — extract pages and show picker
    if (pdfs.length > 0) {
      setExtracting(true)
      setPages([])
      setPdfName(pdfs.map(p => p.name).join(', '))
      try {
        const allEntries: PageEntry[] = []
        for (const pdf of pdfs) {
          try {
            const entries = await pdfToPageEntries(pdf)
            allEntries.push(...entries)
          } catch (err) {
            setError(`${pdf.name}: Could not read PDF — ${err instanceof Error ? err.message : 'unknown error'}`)
          }
        }
        setPages(allEntries)
      } finally {
        setExtracting(false)
        if (fileRef.current) fileRef.current.value = ''
      }

      // If images came along with PDFs, also process them
      if (images.length) {
        setLoading(true)
        try {
          await analyzeAndAppend(images.map(f => ({ file: f, label: f.name })))
        } finally {
          setLoading(false)
        }
      }
    }
  }

  function togglePage(id: string) {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
  }

  function selectAllPages(selected: boolean) {
    setPages(prev => prev.map(p => ({ ...p, selected })))
  }

  function selectOnlyUnanalyzed() {
    setPages(prev => prev.map(p => ({ ...p, selected: p.status === 'idle' || p.status === 'error' })))
  }

  function clearPages() {
    // Drop the picker and any rooms tied to its pages
    const pageIds = new Set(pages.map(p => p.id))
    setRooms(prev => prev.filter(r => !r.pageId || !pageIds.has(r.pageId)))
    setPages([])
    setPdfName('')
  }

  async function analyzeSelectedPages() {
    const toRun = pages.filter(p => p.selected)
    if (!toRun.length) return
    setLoading(true)
    setError('')

    // Mark selected as analyzing
    setPages(prev => prev.map(p => p.selected ? { ...p, status: 'analyzing' } : p))

    // Remove any previously-extracted rooms for these pages so re-analysis replaces them
    const ids = new Set(toRun.map(p => p.id))
    setRooms(prev => prev.filter(r => !r.pageId || !ids.has(r.pageId)))

    const skipped: string[] = []
    const errors: string[] = []

    for (const p of toRun) {
      const { rooms: extracted, notes: pageNotes, error, skipped: skip } = await analyzeFile(p.file)

      if (error) {
        errors.push(`${p.label}: ${error}`)
        setPages(prev => prev.map(x => x.id === p.id ? { ...x, status: 'error', errorMsg: error, rooms: [] } : x))
        continue
      }
      if (skip) {
        skipped.push(`${p.label} (${skip.reason})`)
        setPages(prev => prev.map(x => x.id === p.id ? { ...x, status: 'skipped', pageType: skip.reason, rooms: [] } : x))
        continue
      }

      const tagged = extracted.map(r => ({ ...r, pageId: p.id }))
      setPages(prev => prev.map(x => x.id === p.id ? { ...x, status: 'analyzed', rooms: tagged, pageType: undefined } : x))
      setRooms(prev => [...prev, ...tagged])
      if (pageNotes) setNotes(prev => [prev, pageNotes].filter(Boolean).join('\n'))
    }

    const messages: string[] = []
    if (errors.length) messages.push(errors.join(' · '))
    if (skipped.length) messages.push(`Skipped non-flooring: ${skipped.join(', ')}`)
    if (messages.length) setError(messages.join(' · '))
    setLoading(false)
  }

  function removeRoom(idx: number) {
    setRooms(prev => prev.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setRooms([])
    setNotes('')
    setError('')
    setSaveSuccess(false)
    setPages([])
    setPdfName('')
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
          <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={handleUpload} />
          <div
            onClick={() => !loading && !extracting && fileRef.current?.click()}
            className="rounded-2xl transition-all"
            style={{
              border: '2px dashed',
              borderColor: (loading || extracting) ? 'var(--primary)' : '#d1d5db',
              background: (loading || extracting) ? 'rgba(13,148,136,0.03)' : 'white',
              cursor: (loading || extracting) ? 'default' : 'pointer',
            }}
          >
            {extracting ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Reading PDF pages…</p>
                  <p className="text-xs text-gray-400 mt-1">Extracting page previews so you can pick which to analyze</p>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Analyzing…</p>
                  <p className="text-xs text-gray-400 mt-1">Usually 10–20 seconds per page</p>
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
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC, or PDF — pick which pages to analyze after upload</p>
                </div>
                <span className="text-xs font-semibold px-4 py-2 rounded-xl text-white" style={{ background: 'var(--primary)' }}>
                  Choose file
                </span>
              </div>
            )}
          </div>

          {/* Page picker */}
          {pages.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.08)' }}>
                    <ImageIcon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {pages.length} page{pages.length !== 1 ? 's' : ''} found
                    </p>
                    {pdfName && <p className="text-xs text-gray-400 truncate">{pdfName}</p>}
                  </div>
                </div>
                <button
                  onClick={clearPages}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 px-2 py-1.5"
                  title="Remove PDF and all extracted rooms"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick selectors */}
              <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <span className="text-xs font-semibold text-gray-500">Select:</span>
                <button onClick={() => selectAllPages(true)} className="text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-white transition-colors">All</button>
                <button onClick={() => selectAllPages(false)} className="text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-white transition-colors">None</button>
                <button onClick={selectOnlyUnanalyzed} className="text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-white transition-colors">Unanalyzed</button>
                <span className="text-xs text-gray-400 ml-auto">
                  {pages.filter(p => p.selected).length} of {pages.length} selected
                </span>
              </div>

              {/* Page grid */}
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pages.map(p => {
                  const statusBadge = (() => {
                    if (p.status === 'analyzing') return { label: 'Analyzing…', color: 'var(--primary)', bg: 'rgba(13,148,136,0.1)' }
                    if (p.status === 'analyzed') return { label: `${p.rooms.length} room${p.rooms.length !== 1 ? 's' : ''}`, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' }
                    if (p.status === 'skipped') return { label: p.pageType || 'Skipped', color: '#a16207', bg: 'rgba(161,98,7,0.08)' }
                    if (p.status === 'error') return { label: 'Error', color: '#dc2626', bg: 'rgba(220,38,38,0.08)' }
                    return null
                  })()
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePage(p.id)}
                      className="relative rounded-xl border-2 transition-all overflow-hidden text-left bg-white hover:shadow-md"
                      style={{
                        borderColor: p.selected ? 'var(--primary)' : '#e5e7eb',
                        background: p.selected ? 'rgba(13,148,136,0.02)' : 'white',
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                        <img src={p.thumbUrl} alt={p.label} className="w-full h-full object-contain" />
                        {/* Checkbox overlay */}
                        <div
                          className="absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center"
                          style={{
                            background: p.selected ? 'var(--primary)' : 'rgba(255,255,255,0.95)',
                            border: '1.5px solid',
                            borderColor: p.selected ? 'var(--primary)' : '#d1d5db',
                          }}
                        >
                          {p.selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        {p.status === 'analyzing' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
                          </div>
                        )}
                      </div>
                      {/* Footer */}
                      <div className="px-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-700">{p.label}</span>
                          {statusBadge && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded truncate"
                              style={{ color: statusBadge.color, background: statusBadge.bg, maxWidth: '70%' }}
                              title={statusBadge.label}
                            >
                              {statusBadge.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={analyzeSelectedPages}
                  disabled={loading || pages.filter(p => p.selected).length === 0}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--primary)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Analyzing…' : `Analyze ${pages.filter(p => p.selected).length} page${pages.filter(p => p.selected).length !== 1 ? 's' : ''}`}
                </button>
                {pages.some(p => p.status === 'analyzed' || p.status === 'skipped' || p.status === 'error') && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {pages.filter(p => p.status === 'analyzed').length} analyzed · {pages.filter(p => p.status === 'skipped').length} skipped
                  </span>
                )}
              </div>
            </div>
          )}
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
