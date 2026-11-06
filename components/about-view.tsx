'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Download, Globe2, Play } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { fadeUp, inView, stagger } from '@/components/motion-kit'
import { pick } from '@/lib/localize'
import type { Settings } from '@/lib/types'

export function AboutView({ settings }: { settings: Settings }) {
  const { t, locale } = useLanguage()
  const paragraphs = pick(settings.about, locale).split(/\n{2,}/).filter(Boolean)

  return (
    <>
      <section className="section-wrap" style={{ paddingTop: 50 }}>
        <div className="about-grid">
          <motion.div variants={stagger} {...inView}>
            <motion.span variants={fadeUp} className="eyebrow"><span /> {t('about.story')}</motion.span>
            {paragraphs.map((p, i) => <motion.p key={i} variants={fadeUp} className="about-text">{p}</motion.p>)}
          </motion.div>
          <motion.div className="about-logo" initial={{ opacity: 0, scale: 0.8, rotate: -6 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            <img src={settings.logoUrl} alt="CKTV logo" />
          </motion.div>
        </div>

        <motion.div className="mv-grid" variants={stagger} {...inView}>
          <motion.div className="mv-card" variants={fadeUp} whileHover={{ y: -6 }}>
            <span className="eyebrow">{t('about.mission')}</span>
            <p>{pick(settings.mission, locale)}</p>
          </motion.div>
          <motion.div className="mv-card gold" variants={fadeUp} whileHover={{ y: -6 }}>
            <span className="eyebrow">{t('about.vision')}</span>
            <p>{pick(settings.vision, locale)}</p>
          </motion.div>
        </motion.div>

        <motion.div className="why-grid" variants={stagger} {...inView} style={{ marginTop: 40 }}>
          {[{ i: Play, a: 'why.1.t', b: 'why.1.d' }, { i: Download, a: 'why.2.t', b: 'why.2.d' }, { i: Globe2, a: 'why.3.t', b: 'why.3.d' }].map((c) => {
            const Icon = c.i
            return (
              <motion.div key={c.a} className="why-card" variants={fadeUp} whileHover={{ y: -6 }}>
                <span className="why-icon"><Icon size={22} /></span>
                <h3>{t(c.a as 'why.1.t')}</h3>
                <p>{t(c.b as 'why.1.d')}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      <section className="cta-band">
        <motion.div variants={stagger} {...inView}>
          <motion.h2 variants={fadeUp}>{t('cta.title')}</motion.h2>
          <motion.p variants={fadeUp}>{t('cta.sub')}</motion.p>
          <motion.div variants={fadeUp} className="cta-actions">
            <motion.div whileHover={{ scale: 1.05 }}><Link href="/watch" className="cta-primary">{t('watch.all')} <ArrowRight size={16} /></Link></motion.div>
            <motion.div whileHover={{ scale: 1.05 }}><Link href="/contact" className="cta-ghost">{t('header.cta')}</Link></motion.div>
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}
