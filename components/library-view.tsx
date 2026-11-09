'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { ease, fadeUp, inView } from '@/components/motion-kit'
import { VideoCard } from '@/components/video-card'
import { pick } from '@/lib/localize'
import type { TranslationKey } from '@/lib/i18n'
import { CATEGORIES, type Category, type Video } from '@/lib/types'

const chips: { id: 'all' | Category; label: TranslationKey }[] = [
  { id: 'all', label: 'cat.all' },
  { id: 'podcast', label: 'cat.podcast' },
  { id: 'teaching', label: 'cat.teaching' },
  { id: 'worship', label: 'cat.worship' },
  { id: 'interview', label: 'cat.interview' },
    { id: 'event', label: 'cat.event' },
  { id: 'other', label: 'cat.other' },
]

export function LibraryView({ videos, initialCategory }: { videos: Video[]; initialCategory?: string }) {
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | Category>(CATEGORIES.includes(initialCategory as Category) ? (initialCategory as Category) : 'all')
  const [sort, setSort] = useState<'new' | 'old'>('new')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = videos.filter((v) => {
      if (category !== 'all' && v.category !== category) return false
      if (!q) return true
      const hay = `${pick(v.title, locale)} ${v.title.en ?? ''} ${pick(v.description, locale)}`.toLowerCase()
      return hay.includes(q)
    })
    return list.sort((a, b) => (sort === 'new' ? (a.date < b.date ? 1 : -1) : a.date > b.date ? 1 : -1))
  }, [videos, query, category, sort, locale])

  return (
    <section className="section-wrap" style={{ paddingTop: 36 }}>
      <motion.div className="lib-toolbar" variants={fadeUp} {...inView}>
        <label className="lib-search">
          <Search size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('lib.search')} aria-label={t('lib.search')} />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear"><X size={16} /></button>}
        </label>
        <label className="lib-sort">
          <span>{t('lib.sort')}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'old')}>
            <option value="new">{t('lib.newest')}</option>
            <option value="old">{t('lib.oldest')}</option>
          </select>
        </label>
      </motion.div>

      <div className="chip-row">
        {chips.map((chip) => (
          <motion.button key={chip.id} className={`chip ${category === chip.id ? 'active' : ''}`} onClick={() => setCategory(chip.id)} whileTap={{ scale: 0.94 }}>
            {category === chip.id && <motion.span layoutId="lib-chip-pill" className="chip-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span>{t(chip.label)}</span>
          </motion.button>
        ))}
      </div>

      <p className="lib-count">{t('lib.count').replace('{n}', String(results.length))}</p>

      <motion.div className="video-grid" layout>
        <AnimatePresence>
          {results.map((video, i) => (
            <motion.div key={video.id} layout className="video-cell" exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease }}>
              <VideoCard video={video} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {results.length === 0 && <p className="empty-state">{videos.length === 0 ? t('video.empty') : t('lib.none')}</p>}
    </section>
  )
}
