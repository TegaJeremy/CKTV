'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { ease } from '@/components/motion-kit'
import { pick } from '@/lib/localize'
import { formatDate, formatDuration, thumbOf } from '@/lib/media'
import type { TranslationKey } from '@/lib/i18n'
import type { Video } from '@/lib/types'

export function VideoCard({ video, index = 0 }: { video: Video; index?: number }) {
  const { t, locale } = useLanguage()
  const image = thumbOf(video, 700)
  const duration = formatDuration(video.duration)

  return (
    <motion.article
      className="video-card"
      initial={{ opacity: 0, y: 36, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.55, ease, delay: Math.min(index, 6) * 0.07 }}
    >
      <Link href={`/watch/${video.id}`} className="block">
        <div className="video-thumb">
          {image ? <img src={image} alt="" loading="lazy" /> : <div className="thumb-fallback" />}
          <div className="thumb-overlay" />
          {duration && <span className="video-duration">{duration}</span>}
          <span className="thumb-play" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
        </div>
        <div className="video-meta">
          <span>{t(`vcat.${video.category}` as TranslationKey)}</span>
          <small>{formatDate(video.date, locale)}</small>
        </div>
        <h3>{pick(video.title, locale)}</h3>
      </Link>
    </motion.article>
  )
}
