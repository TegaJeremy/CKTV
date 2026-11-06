'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLanguage } from '@/components/language-provider'

export function NotFoundView() {
  const { t } = useLanguage()
  return (
    <section className="nf">
      <motion.b initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>404</motion.b>
      <h1>{t('nf.title')}</h1>
      <p>{t('nf.sub')}</p>
      <Link href="/" className="primary-button" style={{ width: 'fit-content', margin: '0 auto' }}>{t('nf.home')}</Link>
    </section>
  )
}
