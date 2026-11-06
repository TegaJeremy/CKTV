'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, Download, Play, Share2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { fadeUp, inView, stagger } from '@/components/motion-kit'
import { VideoCard } from '@/components/video-card'
import { pick } from '@/lib/localize'
import { downloadUrl, formatBytes, formatDate, formatDuration, thumbOf } from '@/lib/media'
import type { TranslationKey } from '@/lib/i18n'
import type { Video } from '@/lib/types'

export function VideoView({ video, related }: { video: Video; related: Video[] }) {
  const { t, locale } = useLanguage()
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => setUrl(window.location.href), [video.id])

  const title = pick(video.title, locale)
  const description = pick(video.description, locale)
  const poster = thumbOf(video, 1400)
  const dl = downloadUrl(video.src)

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url })
      else await copy()
    } catch {
      /* cancelled */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <>
      <section className="video-page">
        <Link href="/watch" className="back-link"><ArrowLeft size={16} /> {t('vid.back')}</Link>

        <motion.div className="player-shell" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          {video.src ? (
            <video key={video.id} controls playsInline preload="metadata" poster={poster || undefined} src={video.src} />
          ) : (
            <div className="player-demo" style={poster ? { backgroundImage: `linear-gradient(#0f1b3d99,#0f1b3dcc), url(${poster})` } : undefined}>
              <span className="big-play" aria-hidden="true"><Play fill="currentColor" size={26} /></span>
              <p>Demo preview. Your real video plays here once Cloudinary is connected.</p>
            </div>
          )}
        </motion.div>

        <motion.div className="video-info" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="video-info-meta">
            <span className="pill">{t(`vcat.${video.category}` as TranslationKey)}</span>
            <small>{formatDate(video.date, locale)}</small>
            {formatDuration(video.duration) && <small>{formatDuration(video.duration)}</small>}
          </motion.div>
          <motion.h1 variants={fadeUp}>{title}</motion.h1>
          {description && <motion.p variants={fadeUp} className="video-desc">{description}</motion.p>}

          <motion.div variants={fadeUp} className="video-actions">
            {dl && (
              <motion.a href={dl} className="act act-primary" whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} download>
                <Download size={17} /> {t('vid.download')} {video.bytes ? <small>{formatBytes(video.bytes)}</small> : null}
              </motion.a>
            )}
            <motion.button className="act" onClick={share} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}><Share2 size={17} /> {t('vid.share')}</motion.button>
            <motion.a className="act act-wa" href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer" whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}>{t('vid.whatsapp')}</motion.a>
            <motion.button className="act" onClick={copy} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}>
              {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? t('feature.copied') : t('vid.copy')}
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {related.length > 0 && (
        <section className="section-wrap" style={{ paddingTop: 50 }}>
          <motion.div className="section-heading" variants={fadeUp} {...inView}>
            <div><h2>{t('vid.related')}</h2></div>
          </motion.div>
          <div className="video-grid" style={{ marginTop: 24 }}>
            {related.map((v, i) => <div className="video-cell" key={v.id}><VideoCard video={v} index={i} /></div>)}
          </div>
        </section>
      )}
    </>
  )
}
