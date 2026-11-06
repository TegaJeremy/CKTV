'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { ease, fadeUp, inView, stagger } from '@/components/motion-kit'
import { PostCard } from '@/components/post-card'
import { pick, readingMinutes } from '@/lib/localize'
import { Markdown } from '@/lib/markdown'
import { formatDate, optimizeImage } from '@/lib/media'
import type { Post } from '@/lib/types'

export function PostView({ post, more }: { post: Post; more: Post[] }) {
  const { t, locale } = useLanguage()
  const title = pick(post.title, locale)
  const body = pick(post.body, locale)

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href })
      else await navigator.clipboard.writeText(window.location.href)
    } catch {
      /* cancelled */
    }
  }

  return (
    <>
      <article className="post-page">
        <Link href="/posts" className="back-link"><ArrowLeft size={16} /> {t('post.back')}</Link>
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="video-info-meta">
            <small>{formatDate(post.date, locale)}</small>
            <small>{t('post.min').replace('{n}', String(readingMinutes(body)))}</small>
          </motion.div>
          <motion.h1 variants={fadeUp} className="post-title">{title}</motion.h1>
        </motion.div>
        {post.cover && (
          <motion.img src={optimizeImage(post.cover, 1400)} alt="" className="post-cover" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease }} />
        )}
        <motion.div variants={fadeUp} {...inView}><Markdown text={body} /></motion.div>
        <div className="post-share">
          <motion.button className="act" onClick={share} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}><Share2 size={17} /> {t('vid.share')}</motion.button>
        </div>
      </article>

      {more.length > 0 && (
        <section className="section-wrap" style={{ paddingTop: 30 }}>
          <motion.div className="post-grid" variants={stagger} {...inView}>
            {more.map((p) => <PostCard key={p.slug} post={p} />)}
          </motion.div>
        </section>
      )}
    </>
  )
}

export function PostsIndex({ posts }: { posts: Post[] }) {
  const { t } = useLanguage()
  return (
    <section className="section-wrap" style={{ paddingTop: 36 }}>
      {posts.length === 0 ? (
        <p className="empty-state">{t('post.empty')}</p>
      ) : (
        <motion.div className="post-grid" variants={stagger} {...inView}>
          {posts.map((p) => <PostCard key={p.slug} post={p} />)}
        </motion.div>
      )}
    </section>
  )
}
