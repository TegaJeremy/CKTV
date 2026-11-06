'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Globe2, Menu, Sparkles, X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { ease } from '@/components/motion-kit'
import { locales, type TranslationKey } from '@/lib/i18n'
import type { Settings } from '@/lib/types'

const navItems: { href: string; label: TranslationKey }[] = [
  { href: '/', label: 'nav.home' },
  { href: '/watch', label: 'nav.watch' },
  { href: '/posts', label: 'nav.posts' },
  { href: '/about', label: 'nav.about' },
]

const socialLabels: { key: keyof Settings['socials']; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X' },
]

export function SiteShell({ settings, children }: { settings: Settings; children: ReactNode }) {
  const { t, locale, setLocale } = useLanguage()
  const pathname = usePathname()
  const currentLocale = locales.find((l) => l.code === locale) ?? locales[0]

  const [menuOpen, setMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.2 })
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12))

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

  // close menus when the page changes
  useEffect(() => {
    setMenuOpen(false)
    setLanguageOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!languageOpen) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLanguageOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [languageOpen])

  const socials = socialLabels.filter((s) => settings.socials[s.key])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f8ff] text-[#0f1b3d]">
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />

      <motion.div className="top-ribbon" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <Sparkles size={14} /> {t('ribbon')} <ArrowRight size={14} />
      </motion.div>

      <motion.header
        className={`sticky top-0 z-40 border-b border-blue-100/70 bg-white/90 backdrop-blur-xl ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease, delay: 0.1 }}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="CKTV home">
            <motion.div className="logo-frame" whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
              <img src={settings.logoUrl} alt="CKTV Christian Kingdom Trend Vision logo" />
            </motion.div>
            <div className="hidden sm:block">
              <div className="logo-wordmark">CK<span>TV</span></div>
              <div className="logo-tagline">Christian Kingdom Trend Vision</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#52607d] lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`nav-link ${isActive(item.href) ? 'nav-active' : ''}`}>
                {t(item.label)}
                {isActive(item.href) && <motion.span layoutId="nav-underline" className="nav-underline" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={langRef}>
              <button className="language-button" onClick={() => setLanguageOpen((o) => !o)} aria-expanded={languageOpen} aria-haspopup="listbox" aria-label={t('header.language')}>
                <Globe2 size={17} />
                <span className="hidden sm:inline">{currentLocale.name}</span>
                <span className="lang-code sm:hidden">{currentLocale.code.toUpperCase()}</span>
                <motion.span animate={{ rotate: languageOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}><ChevronDown size={15} /></motion.span>
              </button>
              <AnimatePresence>
                {languageOpen && (
                  <motion.div className="language-menu" role="listbox" initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.18, ease }} style={{ transformOrigin: 'top right' }}>
                    {locales.map((item) => (
                      <button key={item.code} role="option" aria-selected={item.code === locale} onClick={() => { setLocale(item.code); setLanguageOpen(false) }} className={item.code === locale ? 'selected' : ''}>
                        {item.name}
                        {item.code === locale && <Check size={15} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} className="hidden sm:block">
              <Link href="/contact" className="header-cta">{t('header.cta')} <ArrowRight size={16} /></Link>
            </motion.div>
            <button className="menu-button lg:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label={t('header.menu')} aria-expanded={menuOpen}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={menuOpen ? 'x' : 'menu'} style={{ display: 'flex' }} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  {menuOpen ? <X /> : <Menu />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav className="mobile-menu lg:hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
              {[...navItems, { href: '/contact', label: 'nav.contact' as TranslationKey }].map((item, i) => (
                <motion.div key={item.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                  <Link href={item.href} onClick={() => setMenuOpen(false)} style={isActive(item.href) ? { color: '#1d4ed8' } : undefined}>{t(item.label)}</Link>
                </motion.div>
              ))}
              <div className="mobile-language-title"><Globe2 size={16} /> {t('header.language')}</div>
              <div className="mobile-lang-grid">
                {locales.map((item) => (
                  <button key={item.code} className={item.code === locale ? 'selected' : ''} onClick={() => setLocale(item.code)}>{item.name}</button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      <motion.main key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
        {children}
      </motion.main>

      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-brand">
              <div className="logo-frame"><img src={settings.logoUrl} alt="CKTV logo" /></div>
              <div><div className="logo-wordmark">CK<span>TV</span></div><div className="logo-tagline">Christian Kingdom Trend Vision</div></div>
            </div>
            <p>{t('footer.tag1')}<br />{t('footer.tag2')}</p>
          </div>
          <div className="footer-links">
            <div>
              <b>{t('footer.explore')}</b>
              <Link href="/watch">{t('footer.watch')}</Link>
              <Link href="/posts">{t('footer.blog')}</Link>
              <Link href="/about">{t('footer.story')}</Link>
            </div>
            <div>
              <b>{t('footer.connect')}</b>
              <Link href="/contact">{t('footer.contact')}</Link>
              {socials.map((s) => (
                <a key={s.key} href={settings.socials[s.key]} target="_blank" rel="noopener noreferrer">{s.label}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.built')} <motion.span className="heart" style={{ display: 'inline-block' }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>♥</motion.span></span>
        </div>
      </footer>

      <motion.nav className="bottom-nav" initial={{ y: 90 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease, delay: 0.5 }}>
        <Link href="/" className={isActive('/') ? 'active' : ''}><span>⌂</span>{t('nav.home')}</Link>
        <Link href="/watch" className={isActive('/watch') ? 'active' : ''}><span>▶</span>{t('nav.watch')}</Link>
        <Link href="/posts" className={isActive('/posts') ? 'active' : ''}><span>▤</span>{t('nav.posts')}</Link>
        <Link href="/about" className={isActive('/about') || isActive('/contact') ? 'active' : ''}><span>•••</span>{t('nav.more')}</Link>
      </motion.nav>
    </div>
  )
}
