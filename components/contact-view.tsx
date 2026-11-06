'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { fadeUp, inView, stagger } from '@/components/motion-kit'
import type { Settings } from '@/lib/types'

const socialLabels: { key: keyof Settings['socials']; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X' },
]

export function ContactView({ settings }: { settings: Settings }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const whatsappNumber = settings.whatsapp.replace(/[^\d]/g, '')
  const rows = [
    settings.email && { icon: Mail, label: 'Email', value: settings.email, href: `mailto:${settings.email}` },
    settings.phone && { icon: Phone, label: t('contact.phone'), value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, '')}` },
    whatsappNumber && { icon: MessageCircle, label: t('contact.whatsapp'), value: settings.whatsapp, href: `https://wa.me/${whatsappNumber}` },
    settings.address && { icon: MapPin, label: t('contact.address'), value: settings.address, href: '' },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href: string }[]
  const socials = socialLabels.filter((s) => settings.socials[s.key])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!settings.email) return
    const subject = encodeURIComponent(`CKTV website message from ${form.name}`)
    const body = encodeURIComponent(`${form.message}\n\n${form.name}\n${form.email}`)
    window.location.href = `mailto:${settings.email}?subject=${subject}&body=${body}`
  }

  return (
    <section className="section-wrap" style={{ paddingTop: 50 }}>
      <div className="contact-grid">
        <motion.div variants={stagger} {...inView} className="contact-info">
          <motion.h2 variants={fadeUp}>{t('contact.reach')}</motion.h2>
          {rows.length === 0 && <motion.p variants={fadeUp} className="about-text">{t('contact.empty')}</motion.p>}
          {rows.map((r) => {
            const Icon = r.icon
            const content = (
              <>
                <span className="why-icon"><Icon size={20} /></span>
                <span><small>{r.label}</small><b>{r.value}</b></span>
              </>
            )
            return r.href ? (
              <motion.a key={r.label} variants={fadeUp} whileHover={{ x: 6 }} className="contact-row" href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{content}</motion.a>
            ) : (
              <motion.div key={r.label} variants={fadeUp} className="contact-row">{content}</motion.div>
            )
          })}
          {socials.length > 0 && (
            <motion.div variants={fadeUp} className="social-pills">
              <small>{t('contact.follow')}</small>
              <div>{socials.map((s) => <a key={s.key} href={settings.socials[s.key]} target="_blank" rel="noopener noreferrer">{s.label}</a>)}</div>
            </motion.div>
          )}
        </motion.div>

        <motion.form className="contact-form" onSubmit={submit} variants={fadeUp} {...inView}>
          <label>{t('contact.name')}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
          <label>{t('contact.email')}<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
          <label>{t('contact.message')}<textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
          <motion.button type="submit" className="primary-button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} disabled={!settings.email} style={!settings.email ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
            {t('contact.send')} <ArrowRight size={16} />
          </motion.button>
          <small className="form-note">{settings.email ? t('contact.mailnote') : t('contact.empty')}</small>
        </motion.form>
      </div>
    </section>
  )
}
