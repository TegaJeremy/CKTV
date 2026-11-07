'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bold, Check, ExternalLink, Eye, FileText, Film, Heading2, Image as ImageIcon, LayoutDashboard, Link2, List, Loader2, Pencil, Plus, Quote, Settings as SettingsIcon, Star, Trash2, UploadCloud, X } from 'lucide-react'
import { locales } from '@/lib/i18n'
import { Markdown } from '@/lib/markdown'
import { formatBytes, formatDuration, thumbOf } from '@/lib/media'
import { CATEGORIES, type Category, type Localized, type Post, type Settings, type Video } from '@/lib/types'
import { uploadFile } from './upload'

/* ------------------------------------------------------------------ */
/*  small shared bits                                                   */
/* ------------------------------------------------------------------ */

const input = 'w-full rounded-xl border border-[#dfe8f7] bg-white px-3.5 py-2.5 text-sm text-[#0f1b3d] outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/15'
const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const btnPrimary = `${btn} bg-[#1d4ed8] text-white shadow-md shadow-[#1d4ed8]/25 hover:bg-[#1a44bd]`
const btnGhost = `${btn} border border-[#dfe8f7] bg-white text-[#0f1b3d] hover:bg-[#f4f8ff]`
const btnDanger = `${btn} bg-[#ff6b35]/10 text-[#d9480f] hover:bg-[#ff6b35]/20`
const card = 'rounded-2xl border border-[#dfe8f7] bg-white p-5 shadow-sm'
const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#52607d]'

type Tab = 'overview' | 'videos' | 'posts' | 'settings'
type Toast = { id: number; text: string; kind: 'ok' | 'error' }

const today = () => new Date().toISOString().slice(0, 10)

function Field({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className={label}>{title}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#8290aa]">{hint}</p>}
    </div>
  )
}

/** One field that can optionally be translated into the other five languages. */
function LocalizedField({ title, value, onChange, rows = 0, hint }: { title: string; value: Localized; onChange: (v: Localized) => void; rows?: number; hint?: string }) {
  const [open, setOpen] = useState(false)
  const set = (code: string, text: string) => onChange({ ...value, [code]: text })
  const Tag = rows > 0 ? 'textarea' : 'input'
  const filled = locales.filter((l) => l.code !== 'en' && value[l.code]?.trim()).length
  return (
    <div>
      <label className={label}>{title} <span className="font-normal normal-case text-[#8290aa]">(English)</span></label>
      <Tag className={input} rows={rows || undefined} value={value.en ?? ''} onChange={(e) => set('en', e.target.value)} />
      {hint && <p className="mt-1 text-xs text-[#8290aa]">{hint}</p>}
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 text-xs font-bold text-[#1d4ed8] hover:underline">
        {open ? 'Hide translations' : `Translations (optional)${filled ? ` · ${filled} added` : ''}`}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-3 rounded-xl bg-[#f4f8ff] p-3">
              {locales.filter((l) => l.code !== 'en').map((l) => (
                <div key={l.code}>
                  <label className="mb-1 block text-xs font-semibold text-[#52607d]">{l.name}</label>
                  <Tag className={input} rows={rows || undefined} placeholder="Leave empty to show the English text" value={value[l.code] ?? ''} onChange={(e) => set(l.code, e.target.value)} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-[#0f1b3d]">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[#1d4ed8]' : 'bg-[#cbd5e6]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </span>
      {children}
    </label>
  )
}

function FilePick({ accept, file, onPick, text }: { accept: string; file: File | null; onPick: (f: File | null) => void; text: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#c9d9f1] bg-[#f8fbff] px-4 py-3 text-sm transition hover:border-[#1d4ed8]">
      <UploadCloud size={20} className="shrink-0 text-[#1d4ed8]" />
      <span className="min-w-0 flex-1 truncate font-semibold text-[#52607d]">{file ? `${file.name} (${formatBytes(file.size)})` : text}</span>
      <input type="file" accept={accept} className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
    </label>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#06102b]/60 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className={`flex max-h-[94vh] w-full flex-col rounded-t-3xl bg-[#f4f8ff] shadow-2xl sm:rounded-3xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 280 }}>
        <div className="flex items-center justify-between border-b border-[#dfe8f7] px-5 py-4">
          <h3 className="text-lg font-extrabold text-[#0f1b3d]">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-[#52607d] hover:bg-white" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  main app                                                            */
/* ------------------------------------------------------------------ */

export function AdminApp({ adminKey }: { adminKey: string }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [videos, setVideos] = useState<Video[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const api = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const res = await fetch(path, { ...init, cache: 'no-store', headers: { 'content-type': 'application/json', 'x-admin-key': adminKey, ...(init.headers ?? {}) } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
      return data as T
    },
    [adminKey],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [v, p, s] = await Promise.all([
        api<{ configured: boolean; videos: Video[] }>('/api/admin/videos'),
        api<{ posts: Post[] }>('/api/admin/posts'),
        api<{ settings: Settings }>('/api/admin/settings'),
      ])
      setConfigured(v.configured)
      setVideos(v.videos)
      setPosts(p.posts)
      setSettings(s.settings)
    } catch (e) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const nav: { id: Tab; label: string; icon: typeof Film }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'videos', label: 'Videos', icon: Film },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen bg-[#f4f8ff] text-[#0f1b3d] lg:flex">
      {/* sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#dfe8f7] bg-white p-5 lg:flex">
        <div className="mb-8">
          <p className="text-2xl font-black tracking-tight text-[#1d4ed8]">CK<span className="text-[#f5b301]">TV</span></p>
          <p className="text-xs font-semibold text-[#8290aa]">Admin dashboard</p>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => {
            const Icon = n.icon
            return (
              <button key={n.id} onClick={() => setTab(n.id)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${tab === n.id ? 'bg-[#1d4ed8] text-white shadow-md shadow-[#1d4ed8]/25' : 'text-[#52607d] hover:bg-[#f4f8ff]'}`}>
                <Icon size={18} /> {n.label}
              </button>
            )
          })}
        </nav>
        <a href="/" target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#52607d] hover:bg-[#f4f8ff]"><ExternalLink size={16} /> View website</a>
      </aside>

      <div className="min-w-0 flex-1">
        {/* top bar (mobile) */}
        <header className="sticky top-0 z-30 border-b border-[#dfe8f7] bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xl font-black text-[#1d4ed8]">CK<span className="text-[#f5b301]">TV</span> <span className="text-xs font-semibold text-[#8290aa]">admin</span></p>
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#52607d]">View site ↗</a>
          </div>
          <div className="flex gap-1 overflow-x-auto px-3 pb-2">
            {nav.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${tab === n.id ? 'bg-[#1d4ed8] text-white' : 'bg-[#f4f8ff] text-[#52607d]'}`}>{n.label}</button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
          {loading && <div className="flex items-center gap-2 text-sm font-semibold text-[#52607d]"><Loader2 className="animate-spin" size={18} /> Loading…</div>}
          {loadError && (
            <div className={`${card} border-[#ff6b35]/40`}>
              <p className="font-bold text-[#d9480f]">Could not load your content</p>
              <p className="mt-1 text-sm text-[#52607d]">{loadError}</p>
              <button className={`${btnPrimary} mt-4`} onClick={() => void load()}>Try again</button>
            </div>
          )}
          {!loading && !loadError && settings && (
            <>
              {!configured && (
                <div className="mb-6 rounded-2xl border border-[#f5b301]/50 bg-[#fff8e1] p-4 text-sm text-[#7a5a00]">
                  <b>Cloudinary is not connected yet.</b> Add <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code> and <code>CLOUDINARY_API_SECRET</code> in your environment variables and redeploy. Until then the public site shows demo content and uploads are disabled.
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  {tab === 'overview' && <Overview videos={videos} posts={posts} go={setTab} />}
                  {tab === 'videos' && <VideosTab adminKey={adminKey} api={api} videos={videos} setVideos={setVideos} settings={settings} setSettings={setSettings} toast={toast} configured={configured} />}
                  {tab === 'posts' && <PostsTab adminKey={adminKey} api={api} posts={posts} setPosts={setPosts} toast={toast} configured={configured} />}
                  {tab === 'settings' && <SettingsTab adminKey={adminKey} api={api} settings={settings} setSettings={setSettings} videos={videos} toast={toast} configured={configured} />}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${t.kind === 'ok' ? 'bg-[#0f1b3d] text-white' : 'bg-[#d9480f] text-white'}`}>
              {t.kind === 'ok' ? <Check size={16} className="mt-0.5 shrink-0 text-[#f5b301]" /> : <X size={16} className="mt-0.5 shrink-0" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

type Api = <T>(path: string, init?: RequestInit) => Promise<T>
type ToastFn = (text: string, kind?: Toast['kind']) => void

/* ------------------------------------------------------------------ */
/*  overview                                                            */
/* ------------------------------------------------------------------ */

function Overview({ videos, posts, go }: { videos: Video[]; posts: Post[]; go: (t: Tab) => void }) {
  const stats = [
    { label: 'Videos', value: videos.length, tab: 'videos' as Tab },
    { label: 'Published', value: videos.filter((v) => v.published).length + posts.filter((p) => p.published).length, tab: 'videos' as Tab },
    { label: 'Drafts', value: videos.filter((v) => !v.published).length + posts.filter((p) => !p.published).length, tab: 'posts' as Tab },
    { label: 'Posts', value: posts.length, tab: 'posts' as Tab },
  ]
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-[#52607d]">Manage everything on the CKTV website from here.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.button key={s.label} onClick={() => go(s.tab)} className={`${card} text-left transition hover:-translate-y-1 hover:shadow-md`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <p className="text-3xl font-black text-[#1d4ed8]">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-[#8290aa]">{s.label}</p>
          </motion.button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button className={btnPrimary} onClick={() => go('videos')}><Plus size={16} /> Upload a video</button>
        <button className={btnGhost} onClick={() => go('posts')}><Plus size={16} /> Write a post</button>
        <button className={btnGhost} onClick={() => go('settings')}><SettingsIcon size={16} /> Site settings</button>
      </div>
      <div className={card}>
        <h2 className="mb-3 font-extrabold">Latest uploads</h2>
        {videos.length === 0 ? <p className="text-sm text-[#8290aa]">No videos yet. Upload your first one!</p> : (
          <ul className="divide-y divide-[#edf2f9]">
            {videos.slice(0, 5).map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate font-semibold">{v.title.en}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${v.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{v.published ? 'Live' : 'Draft'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  videos                                                              */
/* ------------------------------------------------------------------ */

type VideoDraft = Omit<Video, 'id' | 'assetId' | 'src' | 'thumb'> & { id?: string; assetId?: string; src?: string; thumb?: string }

const blankVideo = (): VideoDraft => ({ title: {}, description: {}, category: 'teaching', date: today(), published: true })

function VideosTab({ adminKey, api, videos, setVideos, settings, setSettings, toast, configured }: { adminKey: string; api: Api; videos: Video[]; setVideos: (v: Video[]) => void; settings: Settings; setSettings: (s: Settings) => void; toast: ToastFn; configured: boolean }) {
  const [editing, setEditing] = useState<VideoDraft | null>(null)
  const [deleting, setDeleting] = useState<Video | null>(null)
  const [busy, setBusy] = useState(false)

  async function togglePublished(v: Video) {
    try {
      const res = await api<{ videos: Video[] }>('/api/admin/videos', { method: 'PUT', body: JSON.stringify({ ...v, published: !v.published }) })
      setVideos(res.videos)
      toast(v.published ? 'Moved to drafts' : 'Published')
    } catch (e) { toast((e as Error).message, 'error') }
  }

  async function feature(v: Video) {
    try {
      const res = await api<{ settings: Settings }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ ...settings, featuredId: v.id }) })
      setSettings(res.settings)
      toast('Featured on the home page')
    } catch (e) { toast((e as Error).message, 'error') }
  }

  async function remove() {
    if (!deleting) return
    setBusy(true)
    try {
      const res = await api<{ videos: Video[] }>(`/api/admin/videos?id=${encodeURIComponent(deleting.id)}`, { method: 'DELETE' })
      setVideos(res.videos)
      toast('Video deleted')
      setDeleting(null)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Videos</h1>
        <button className={btnPrimary} onClick={() => setEditing(blankVideo())} disabled={!configured}><Plus size={16} /> Upload video</button>
      </div>

      {videos.length === 0 ? (
        <div className={`${card} py-12 text-center`}>
          <Film className="mx-auto mb-3 text-[#c9d9f1]" size={40} />
          <p className="font-bold">No videos yet</p>
          <p className="text-sm text-[#8290aa]">Upload your first episode to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {videos.map((v) => {
            const img = thumbOf(v, 300)
            return (
              <li key={v.id} className={`${card} flex flex-wrap items-center gap-4 !p-3 sm:!p-4`}>
                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-[#e3eeff]">{img && <img src={img} alt="" className="h-full w-full object-cover" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{v.title.en}</p>
                  <p className="text-xs text-[#8290aa]">{v.category} · {v.date}{v.duration ? ` · ${formatDuration(v.duration)}` : ''}{v.bytes ? ` · ${formatBytes(v.bytes)}` : ''}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button onClick={() => togglePublished(v)} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${v.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{v.published ? 'Live' : 'Draft'}</button>
                    {settings.featuredId === v.id && <span className="rounded-full bg-[#fff3c7] px-2.5 py-0.5 text-xs font-bold text-[#a06a00]">★ Featured</span>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button className={`${btnGhost} !p-2.5`} onClick={() => feature(v)} title="Feature on home page" aria-label="Feature on home page"><Star size={16} /></button>
                  <a className={`${btnGhost} !p-2.5`} href={`/watch/${v.id}`} target="_blank" rel="noopener noreferrer" title="View" aria-label="View"><Eye size={16} /></a>
                  <button className={`${btnGhost} !p-2.5`} onClick={() => setEditing(v)} title="Edit" aria-label="Edit"><Pencil size={16} /></button>
                  <button className={`${btnDanger} !p-2.5`} onClick={() => setDeleting(v)} title="Delete" aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AnimatePresence>
        {editing && <VideoEditor key={editing.id ?? 'new'} adminKey={adminKey} api={api} draft={editing} onClose={() => setEditing(null)} onSaved={(list) => { setVideos(list); setEditing(null); toast('Video saved') }} toast={toast} />}
        {deleting && (
          <Modal title="Delete this video?" onClose={() => setDeleting(null)}>
            <p className="text-sm text-[#52607d]"><b>{deleting.title.en}</b> will be removed from the website and its files deleted from Cloudinary. This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button className={`${btn} bg-[#d9480f] text-white hover:bg-[#c2410c]`} onClick={remove} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function VideoEditor({ adminKey, api, draft, onClose, onSaved, toast }: { adminKey: string; api: Api; draft: VideoDraft; onClose: () => void; onSaved: (v: Video[]) => void; toast: ToastFn }) {
  const [form, setForm] = useState<VideoDraft>(draft)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<{ step: string; pct: number } | null>(null)
  const isNew = !draft.id

  async function save() {
    if (!form.title.en?.trim()) return toast('Please add an English title.', 'error')
    if (isNew && !videoFile) return toast('Please choose a video file.', 'error')
    try {
      const next: VideoDraft = { ...form }
      if (videoFile) {
        setProgress({ step: 'Uploading video', pct: 0 })
        const up = await uploadFile(videoFile, 'video', adminKey, (pct) => setProgress({ step: 'Uploading video', pct }))
        Object.assign(next, { id: up.public_id.split('/').pop(), assetId: up.public_id, src: up.secure_url, duration: up.duration, bytes: up.bytes, format: up.format })
      }
      if (thumbFile) {
        setProgress({ step: 'Uploading thumbnail', pct: 0 })
        const up = await uploadFile(thumbFile, 'image', adminKey, (pct) => setProgress({ step: 'Uploading thumbnail', pct }))
        Object.assign(next, { thumb: up.secure_url, thumbAssetId: up.public_id })
      }
      setProgress({ step: 'Saving', pct: 100 })
      const res = await api<{ videos: Video[] }>('/api/admin/videos', { method: 'PUT', body: JSON.stringify({ ...next, thumb: next.thumb ?? '' }) })
      onSaved(res.videos)
    } catch (e) {
      toast((e as Error).message, 'error')
      setProgress(null)
    }
  }

  const saving = progress !== null
  return (
    <Modal title={isNew ? 'Upload a video' : 'Edit video'} onClose={saving ? () => undefined : onClose} wide>
      <div className="space-y-5">
        {isNew && (
          <Field title="Video file" hint="MP4, up to 30 MB (about 4 to 5 minutes at 720p). Add the YouTube link below for the full episode.">
            <FilePick accept="video/*" file={videoFile} onPick={setVideoFile} text="Choose a video…" />
          </Field>
        )}
        <Field title={`Thumbnail ${isNew ? '(optional)' : ''}`} hint="If you skip this, a picture from the video is used.">
          <FilePick accept="image/*" file={thumbFile} onPick={setThumbFile} text={form.thumb ? 'Replace thumbnail…' : 'Choose an image…'} />
        </Field>
        <LocalizedField title="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <LocalizedField title="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} rows={4} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Category">
            <select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
          </Field>
          <Field title="Date"><input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
        </div>

        <Field title="Full episode on YouTube (optional)" hint="Paste the YouTube link. The video page will show a button that opens it.">
          <input className={input} placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl ?? ''} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} />
        </Field>

        <Toggle checked={form.published} onChange={(published) => setForm({ ...form, published })}>Publish on the website (turn off to keep as a draft)</Toggle>

        {progress && (
          <div className="rounded-xl bg-white p-4">
            <div className="mb-2 flex justify-between text-sm font-bold"><span>{progress.step}…</span><span>{progress.pct}%</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#e3eeff]"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#f5b301]" animate={{ width: `${progress.pct}%` }} /></div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button className={btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} {isNew ? 'Upload & save' : 'Save changes'}</button>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/*  posts                                                               */
/* ------------------------------------------------------------------ */

type PostDraft = Omit<Post, 'slug' | 'cover'> & { slug?: string; cover?: string }
const blankPost = (): PostDraft => ({ title: {}, excerpt: {}, body: {}, date: today(), published: true })

function PostsTab({ adminKey, api, posts, setPosts, toast, configured }: { adminKey: string; api: Api; posts: Post[]; setPosts: (p: Post[]) => void; toast: ToastFn; configured: boolean }) {
  const [editing, setEditing] = useState<PostDraft | null>(null)
  const [deleting, setDeleting] = useState<Post | null>(null)
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!deleting) return
    setBusy(true)
    try {
      const res = await api<{ posts: Post[] }>(`/api/admin/posts?slug=${encodeURIComponent(deleting.slug)}`, { method: 'DELETE' })
      setPosts(res.posts)
      toast('Post deleted')
      setDeleting(null)
    } catch (e) { toast((e as Error).message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Posts</h1>
        <button className={btnPrimary} onClick={() => setEditing(blankPost())} disabled={!configured}><Plus size={16} /> New post</button>
      </div>
      {posts.length === 0 ? (
        <div className={`${card} py-12 text-center`}>
          <FileText className="mx-auto mb-3 text-[#c9d9f1]" size={40} />
          <p className="font-bold">No posts yet</p>
          <p className="text-sm text-[#8290aa]">Write your first story or devotional.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.slug} className={`${card} flex flex-wrap items-center gap-4 !p-3 sm:!p-4`}>
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#e3eeff]">{p.cover && <img src={p.cover.replace('/upload/', '/upload/w_240,f_auto,q_auto/')} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{p.title.en}</p>
                <p className="text-xs text-[#8290aa]">{p.date}</p>
                <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${p.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.published ? 'Live' : 'Draft'}</span>
              </div>
              <div className="flex gap-1.5">
                <a className={`${btnGhost} !p-2.5`} href={`/posts/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label="View"><Eye size={16} /></a>
                <button className={`${btnGhost} !p-2.5`} onClick={() => setEditing(p)} aria-label="Edit"><Pencil size={16} /></button>
                <button className={`${btnDanger} !p-2.5`} onClick={() => setDeleting(p)} aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AnimatePresence>
        {editing && <PostEditor key={editing.slug ?? 'new'} adminKey={adminKey} api={api} draft={editing} onClose={() => setEditing(null)} onSaved={(list) => { setPosts(list); setEditing(null); toast('Post saved') }} toast={toast} />}
        {deleting && (
          <Modal title="Delete this post?" onClose={() => setDeleting(null)}>
            <p className="text-sm text-[#52607d]"><b>{deleting.title.en}</b> will be removed from the website. This cannot be undone.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setDeleting(null)}>Cancel</button>
              <button className={`${btn} bg-[#d9480f] text-white hover:bg-[#c2410c]`} onClick={remove} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function PostEditor({ adminKey, api, draft, onClose, onSaved, toast }: { adminKey: string; api: Api; draft: PostDraft; onClose: () => void; onSaved: (p: Post[]) => void; toast: ToastFn }) {
  const [form, setForm] = useState<PostDraft>(draft)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)
  const imgInput = useRef<HTMLInputElement>(null)

  const body = form.body.en ?? ''
  const setBody = (text: string) => setForm({ ...form, body: { ...form.body, en: text } })

  /** Wrap the selected text (or insert a template) at the cursor. */
  function format(before: string, after = '', placeholder = '') {
    const el = area.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const selected = body.slice(s, e) || placeholder
    setBody(body.slice(0, s) + before + selected + after + body.slice(e))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + selected.length) })
  }

  async function insertImage(file: File) {
    setUploading(true)
    try {
      const up = await uploadFile(file, 'image', adminKey, () => undefined)
      const el = area.current
      const at = el ? el.selectionStart : body.length
      setBody(`${body.slice(0, at)}\n\n![](${up.secure_url})\n\n${body.slice(at)}`)
      toast('Image added to the post')
    } catch (e) { toast((e as Error).message, 'error') } finally { setUploading(false) }
  }

  async function save() {
    if (!form.title.en?.trim()) return toast('Please add an English title.', 'error')
    if (!body.trim()) return toast('Please write the post text.', 'error')
    setSaving(true)
    try {
      const next = { ...form }
      if (coverFile) {
        const up = await uploadFile(coverFile, 'image', adminKey, () => undefined)
        Object.assign(next, { cover: up.secure_url, coverAssetId: up.public_id })
      }
      const res = await api<{ posts: Post[] }>('/api/admin/posts', { method: 'PUT', body: JSON.stringify({ ...next, cover: next.cover ?? '' }) })
      onSaved(res.posts)
    } catch (e) { toast((e as Error).message, 'error'); setSaving(false) }
  }

  const tools = [
    { icon: Heading2, label: 'Heading', run: () => format('\n\n## ', '\n\n', 'Heading') },
    { icon: Bold, label: 'Bold', run: () => format('**', '**', 'bold text') },
    { icon: List, label: 'List', run: () => format('\n\n- ', '\n- \n\n', 'item') },
    { icon: Quote, label: 'Quote', run: () => format('\n\n> ', '\n\n', 'quote') },
    { icon: Link2, label: 'Link', run: () => format('[', '](https://)', 'link text') },
  ]

  return (
    <Modal title={draft.slug ? 'Edit post' : 'New post'} onClose={saving ? () => undefined : onClose} wide>
      <div className="space-y-5">
        <Field title="Cover image (optional)"><FilePick accept="image/*" file={coverFile} onPick={setCoverFile} text={form.cover ? 'Replace cover image…' : 'Choose a cover image…'} /></Field>
        <LocalizedField title="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <LocalizedField title="Short summary" value={form.excerpt} onChange={(excerpt) => setForm({ ...form, excerpt })} rows={2} hint="Shown on the post cards." />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${label} !mb-0`}>Post text <span className="font-normal normal-case text-[#8290aa]">(English)</span></label>
            <div className="flex rounded-full bg-white p-0.5 text-xs font-bold">
              <button type="button" onClick={() => setPreview(false)} className={`rounded-full px-3 py-1 ${!preview ? 'bg-[#1d4ed8] text-white' : 'text-[#52607d]'}`}>Write</button>
              <button type="button" onClick={() => setPreview(true)} className={`rounded-full px-3 py-1 ${preview ? 'bg-[#1d4ed8] text-white' : 'text-[#52607d]'}`}>Preview</button>
            </div>
          </div>
          {!preview && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tools.map((t) => { const Icon = t.icon; return <button key={t.label} type="button" onClick={t.run} title={t.label} aria-label={t.label} className={`${btnGhost} !p-2`}><Icon size={16} /></button> })}
              <button type="button" onClick={() => imgInput.current?.click()} title="Add image" aria-label="Add image" className={`${btnGhost} !p-2`} disabled={uploading}>{uploading ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}</button>
              <input ref={imgInput} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void insertImage(f); e.target.value = '' }} />
            </div>
          )}
          {preview ? (
            <div className="min-h-[260px] rounded-xl border border-[#dfe8f7] bg-white p-5"><Markdown text={body || '*Nothing to preview yet.*'} /></div>
          ) : (
            <textarea ref={area} className={`${input} font-mono`} rows={14} value={body} onChange={(e) => setBody(e.target.value)} placeholder={'Write your post here.\n\nLeave a blank line between paragraphs.'} />
          )}
        </div>

        <LocalizedTextTranslations form={form} setForm={setForm} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Date"><input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <div className="flex items-end pb-2"><Toggle checked={form.published} onChange={(published) => setForm({ ...form, published })}>Publish on the website</Toggle></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className={btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={btnPrimary} onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save post</button>
        </div>
      </div>
    </Modal>
  )
}

/** Translations of the post text (the English text has its own editor above). */
function LocalizedTextTranslations({ form, setForm }: { form: PostDraft; setForm: (f: PostDraft) => void }) {
  const [open, setOpen] = useState(false)
  const filled = locales.filter((l) => l.code !== 'en' && form.body[l.code]?.trim()).length
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-bold text-[#1d4ed8] hover:underline">{open ? 'Hide text translations' : `Translate the post text (optional)${filled ? ` · ${filled} added` : ''}`}</button>
      {open && (
        <div className="mt-3 space-y-3 rounded-xl bg-[#f4f8ff] p-3">
          {locales.filter((l) => l.code !== 'en').map((l) => (
            <div key={l.code}>
              <label className="mb-1 block text-xs font-semibold text-[#52607d]">{l.name}</label>
              <textarea className={`${input} font-mono`} rows={6} placeholder="Leave empty to show the English text" value={form.body[l.code] ?? ''} onChange={(e) => setForm({ ...form, body: { ...form.body, [l.code]: e.target.value } })} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsTab({ adminKey, api, settings, setSettings, videos, toast, configured }: { adminKey: string; api: Api; settings: Settings; setSettings: (s: Settings) => void; videos: Video[]; toast: ToastFn; configured: boolean }) {
  const [form, setForm] = useState<Settings>(settings)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm((f) => ({ ...f, [key]: value }))
  const setSocial = (key: keyof Settings['socials'], value: string) => setForm((f) => ({ ...f, socials: { ...f.socials, [key]: value } }))
  const published = useMemo(() => videos.filter((v) => v.published), [videos])

  async function save() {
    setSaving(true)
    try {
      let logoUrl = form.logoUrl
      if (logoFile) logoUrl = (await uploadFile(logoFile, 'image', adminKey, () => undefined)).secure_url
      const res = await api<{ settings: Settings }>('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ ...form, logoUrl }) })
      setSettings(res.settings)
      setForm(res.settings)
      setLogoFile(null)
      toast('Settings saved')
    } catch (e) { toast((e as Error).message, 'error') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Site settings</h1>
        <button className={btnPrimary} onClick={save} disabled={saving || !configured}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save settings</button>
      </div>

      <section className={`${card} space-y-5`}>
        <h2 className="font-extrabold">Brand & home page</h2>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#f5b301] bg-white">{form.logoUrl && <img src={form.logoUrl} alt="" className="h-full w-full object-cover" />}</div>
          <div className="min-w-0 flex-1"><FilePick accept="image/*" file={logoFile} onPick={setLogoFile} text="Replace logo…" /></div>
        </div>
        <Field title="Featured video (shown first in the home page slider)">
          <select className={input} value={form.featuredId} onChange={(e) => set('featuredId', e.target.value)}>
            <option value="">Latest video (automatic)</option>
            {published.map((v) => <option key={v.id} value={v.id}>{v.title.en}</option>)}
          </select>
        </Field>
      </section>

      <section className={`${card} space-y-5`}>
        <h2 className="font-extrabold">About page</h2>
        <LocalizedField title="Our story" value={form.about} onChange={(v) => set('about', v)} rows={5} hint="Leave the English box empty to use the built-in text (already translated)." />
        <LocalizedField title="Mission" value={form.mission} onChange={(v) => set('mission', v)} rows={3} />
        <LocalizedField title="Vision" value={form.vision} onChange={(v) => set('vision', v)} rows={3} />
      </section>

      <section className={`${card} space-y-5`}>
        <h2 className="font-extrabold">Verse of the week</h2>
        <LocalizedField title="Verse text" value={form.verse} onChange={(v) => set('verse', v)} rows={3} hint="Add translations from a Bible version you are allowed to use." />
        <Field title="Reference (for example John 3:16)"><input className={input} value={form.verseRef} onChange={(e) => set('verseRef', e.target.value)} /></Field>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className="font-extrabold">Contact details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field title="Email" hint="Needed for the contact form and newsletter button."><input className={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field title="Phone"><input className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field title="WhatsApp number" hint="With country code, e.g. +234…"><input className={input} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
          <Field title="Address"><input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
        </div>
      </section>

      <section className={`${card} space-y-4`}>
        <h2 className="font-extrabold">Social links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'youtube', 'facebook', 'tiktok', 'x'] as const).map((k) => (
            <Field key={k} title={k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)}><input className={input} placeholder="https://…" value={form.socials[k]} onChange={(e) => setSocial(k, e.target.value)} /></Field>
          ))}
        </div>
      </section>

      <div className="flex justify-end"><button className={btnPrimary} onClick={save} disabled={saving || !configured}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Save settings</button></div>
    </div>
  )
}
