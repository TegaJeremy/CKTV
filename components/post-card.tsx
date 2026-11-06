'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { fadeUp } from '@/components/motion-kit'
import { pick } from '@/lib/localize'
import { formatDate, optimizeImage } from '@/lib/media'
import type { Post } from '@/lib/types'

export function PostCard({ post }: { post: Post }) {
  const { t, locale } = useLanguage()
  const title = pick(post.title, locale)
  return (
    <motion.article className="post-card" variants={fadeUp} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="post-image">
          {post.cover ? <img src={optimizeImage(post.cover, 700)} alt="" loading="lazy" /> : <div className="thumb-fallback" />}
          <span>{t('post.read')} <ArrowUpRight size={15} /></span>
        </div>
        <div className="post-info">
          <small>{formatDate(post.date, locale)}</small>
          <h3>{title}</h3>
          <p className="post-excerpt">{pick(post.excerpt, locale)}</p>
          <span className="read-more">{t('post.more')} <ArrowRight size={15} /></span>
        </div>
      </Link>
    </motion.article>
  )
}
