'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/components/language-provider'
import { ease, fadeUp, stagger } from '@/components/motion-kit'
import type { TranslationKey } from '@/lib/i18n'

export function PageHero({ title, sub, eyebrow }: { title: TranslationKey; sub?: TranslationKey; eyebrow?: TranslationKey }) {
  const { t } = useLanguage()
  return (
    <section className="page-hero">
      <div className="page-hero-orb" />
      <motion.div className="page-hero-inner" variants={stagger} initial="hidden" animate="show">
        {eyebrow && <motion.span variants={fadeUp} className="eyebrow"><span /> {t(eyebrow)}</motion.span>}
        <motion.h1 variants={fadeUp}>{t(title)}</motion.h1>
        {sub && <motion.p variants={fadeUp}>{t(sub)}</motion.p>}
      </motion.div>
    </section>
  )
}
