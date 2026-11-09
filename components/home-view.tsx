'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BookOpen, Camera, Download, Globe2, MessageCircle, Mic, Music, Play, Plus, Sparkles } from 'lucide-react'
import { HeroCarousel, type HeroSlide } from '@/components/hero-carousel'
import { useLanguage } from '@/components/language-provider'
import { CountUp, ease, fadeUp, inView, stagger } from '@/components/motion-kit'
import { PostCard } from '@/components/post-card'
import { VideoCard } from '@/components/video-card'
import { pick } from '@/lib/localize'
import { formatDate, formatDuration, thumbOf } from '@/lib/media'
import type { TranslationKey } from '@/lib/i18n'
import type { Category, Post, Settings, Video } from '@/lib/types'

const brandSlides: { id: string; key: TranslationKey; image: string }[] = [
  { id: 'b1', key: 'hero.s1.t', image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80' },
  { id: 'b2', key: 'hero.s2.t', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80' },
  { id: 'b3', key: 'hero.s3.t', image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80' },
]

const chips: { id: 'all' | Category; label: TranslationKey }[] = [
  { id: 'all', label: 'cat.all' },
  { id: 'podcast', label: 'cat.podcast' },
  { id: 'teaching', label: 'cat.teaching' },
  { id: 'worship', label: 'cat.worship' },
  { id: 'interview', label: 'cat.interview' },
    { id: 'event', label: 'cat.event' },
]

const topicCards = [
  { id: 'podcast', label: 'cat.podcast', icon: Mic, tone: 'blue' },
  { id: 'teaching', label: 'cat.teaching', icon: BookOpen, tone: 'gold' },
  { id: 'worship', label: 'cat.worship', icon: Music, tone: 'coral' },
  { id: 'interview', label: 'cat.interview', icon: MessageCircle, tone: 'navy' },
    { id: 'event', label: 'cat.event', icon: Camera, tone: 'teal' },
] as const satisfies readonly { id: Category; label: TranslationKey; icon: unknown; tone: string }[]

const marquee: TranslationKey[] = ['marq.1', 'marq.2', 'marq.3', 'marq.4', 'marq.5', 'marq.6', 'marq.7']

const whyCards = [
  { icon: Play, t: 'why.1.t', d: 'why.1.d' },
  { icon: Download, t: 'why.2.t', d: 'why.2.d' },
  { icon: Globe2, t: 'why.3.t', d: 'why.3.d' },
] as const satisfies readonly { icon: unknown; t: TranslationKey; d: TranslationKey }[]

const stepCards = [
  { t: 'steps.1.t', d: 'steps.1.d' },
  { t: 'steps.2.t', d: 'steps.2.d' },
  { t: 'steps.3.t', d: 'steps.3.d' },
] as const satisfies readonly { t: TranslationKey; d: TranslationKey }[]

const faqs = [
  { q: 'faq.1.q', a: 'faq.1.a' },
  { q: 'faq.2.q', a: 'faq.2.a' },
  { q: 'faq.3.q', a: 'faq.3.a' },
  { q: 'faq.4.q', a: 'faq.4.a' },
] as const satisfies readonly { q: TranslationKey; a: TranslationKey }[]

function isRecent(iso: string) {
  return Date.now() - new Date(`${iso}T12:00:00`).getTime() < 14 * 24 * 3600 * 1000
}

export function HomeView({ videos, posts, settings }: { videos: Video[]; posts: Post[]; settings: Settings }) {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | Category>('all')

  const { scrollY } = useScroll()
  const orbOneY = useTransform(scrollY, [0, 700], [0, -90])
  const orbTwoY = useTransform(scrollY, [0, 700], [0, 70])

  const featured = videos.find((v) => v.id === settings.featuredId) ?? videos[0]
  const spotlight = videos.find((v) => v.category === 'podcast') ?? featured

  const slides: HeroSlide[] = useMemo(() => {
    if (videos.length === 0) {
      return brandSlides.map((b) => ({ id: b.id, href: '/watch', title: t(b.key), tag: 'CKTV', image: b.image }))
    }
    const rest = videos.filter((v) => v.id !== featured?.id).slice(0, 4)
    return [featured, ...rest].filter(Boolean).map((v) => ({
      id: v.id,
      href: `/watch/${v.id}`,
      title: pick(v.title, locale),
      tag: t(`vcat.${v.category}` as TranslationKey),
      meta: [formatDate(v.date, locale), formatDuration(v.duration)].filter(Boolean).join(' · '),
      image: thumbOf(v, 1100),
      isNew: isRecent(v.date),
    }))
  }, [videos, featured, locale, t])

  const filtered = (filter === 'all' ? videos : videos.filter((v) => v.category === filter)).slice(0, 8)
  const countOf = (c: Category) => videos.filter((v) => v.category === c).length

  function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email') ?? '')
    if (!settings.email) {
      router.push('/contact')
      return
    }
    window.location.href = `mailto:${settings.email}?subject=${encodeURIComponent('Please add me to the CKTV list')}&body=${encodeURIComponent(`Please add this email to the CKTV list: ${email}`)}`
  }

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section id="home" className="hero-section">
        <motion.div className="hero-orb orb-one" style={{ y: orbOneY }} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="hero-orb orb-two" style={{ y: orbTwoY }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
        <span className="spark spark-1" /><span className="spark spark-2" /><span className="spark spark-3" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-24">
          <motion.div className="relative z-10" variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} className="eyebrow"><span /> {t('hero.eyebrow')}</motion.div>
            <h1>
              <motion.span variants={fadeUp} className="block">{t('hero.line1')} <em className="shimmer">{t('hero.em1')}</em></motion.span>
              <motion.span variants={fadeUp} className="block">{t('hero.line2')} <strong>{t('hero.em2')}</strong></motion.span>
            </h1>
            <motion.p variants={fadeUp} className="hero-copy">{t('hero.copy')}</motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
              <motion.div whileHover={{ y: -3, scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                <Link href={featured ? `/watch/${featured.id}` : '/watch'} className="primary-button">
                  <span className="play-dot"><Play size={14} fill="currentColor" /></span> {t('hero.watch')}
                </Link>
              </motion.div>
              <Link className="text-link" href="/watch">{t('hero.explore')} <ArrowRight size={17} /></Link>
            </motion.div>
            <motion.div variants={fadeUp} className="hero-stats">
              <div><CountUp to={videos.length} /><span>{t('stat.episodes')}</span></div>
              <div><CountUp to={6} /><span>{t('stat.languages')}</span></div>
              <div><CountUp to={posts.length} /><span>{t('stat.posts')}</span></div>
            </motion.div>
          </motion.div>

          <motion.div className="relative z-10" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease, delay: 0.25 }}>
            <HeroCarousel slides={slides} />
            <motion.div className="floating-note" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: [0, -9, 0] }} transition={{ opacity: { delay: 1, duration: 0.5 }, y: { delay: 1, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}>
              <div className="note-icon"><Sparkles size={17} /></div>
              <div><b>{t('note.title')}</b><span>{t('note.sub')}</span></div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="marquee-set" key={copy}>
              {marquee.map((k) => (
                <span key={`${copy}-${k}`}>{t(k)}<i>✦</i></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- LATEST VIDEOS ---------------- */}
      <section id="watch" className="section-wrap">
        <motion.div className="section-heading" variants={fadeUp} {...inView}>
          <div><span className="eyebrow">{t('watch.eyebrow')}</span><h2>{t('watch.title1')}<span>{t('watch.title2')}</span></h2></div>
          <Link href="/watch" className="text-link">{t('watch.all')} <ArrowRight size={17} /></Link>
        </motion.div>

        <motion.div className="chip-row" variants={fadeUp} {...inView}>
          {chips.map((chip) => (
            <motion.button key={chip.id} className={`chip ${filter === chip.id ? 'active' : ''}`} onClick={() => setFilter(chip.id)} whileTap={{ scale: 0.94 }}>
              {filter === chip.id && <motion.span layoutId="chip-pill" className="chip-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span>{t(chip.label)}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div className="video-row" layout>
          <AnimatePresence>
            {filtered.map((video, i) => (
              <motion.div key={video.id} layout className="video-cell" exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease }}>
                <VideoCard video={video} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <p className="empty-state">{t('video.empty')}</p>}
        </motion.div>
      </section>

      {/* ---------------- BROWSE BY TOPIC ---------------- */}
      <section className="section-wrap" style={{ paddingTop: 70 }}>
        <motion.div className="section-heading" variants={fadeUp} {...inView}>
          <div><span className="eyebrow">{t('browse.eyebrow')}</span><h2>{t('browse.title1')}<span>{t('browse.title2')}</span></h2></div>
        </motion.div>
        <motion.div className="topic-grid" variants={stagger} {...inView}>
          {topicCards.map((c) => {
            const Icon = c.icon
            return (
              <motion.div key={c.id} variants={fadeUp} whileHover={{ y: -8, rotate: -1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                <Link href={`/watch?category=${c.id}`} className={`topic-card tone-${c.tone}`}>
                  <span className="topic-icon"><Icon size={26} /></span>
                  <b>{t(c.label)}</b>
                  <small>{countOf(c.id)} {t('browse.count')}</small>
                  <ArrowRight size={18} className="topic-arrow" />
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ---------------- PODCAST SPOTLIGHT ---------------- */}
      {spotlight && (
        <section className="section-wrap" style={{ paddingTop: 70 }}>
          <motion.div className="spotlight" variants={fadeUp} {...inView}>
            <Link href={`/watch/${spotlight.id}`} className="spotlight-media">
              {thumbOf(spotlight, 1000) ? <img src={thumbOf(spotlight, 1000)} alt="" loading="lazy" /> : <div className="thumb-fallback" />}
              <span className="big-play" aria-hidden="true"><Play fill="currentColor" size={24} /></span>
            </Link>
            <div className="spotlight-copy">
              <span className="eyebrow">{t('spot.eyebrow')}</span>
              <h3>{pick(spotlight.title, locale)}</h3>
              <p>{pick(spotlight.description, locale)}</p>
              <motion.div whileHover={{ x: 4 }}>
                <Link href={`/watch/${spotlight.id}`} className="primary-button" style={{ width: 'fit-content' }}>{t('spot.cta')} <ArrowRight size={16} /></Link>
              </motion.div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ---------------- WHY CKTV ---------------- */}
      <section className="section-wrap" style={{ paddingTop: 80 }}>
        <motion.div className="section-heading" variants={fadeUp} {...inView}>
          <div><span className="eyebrow">{t('why.eyebrow')}</span><h2>{t('why.title1')}<span>{t('why.title2')}</span></h2></div>
        </motion.div>
        <motion.div className="why-grid" variants={stagger} {...inView}>
          {whyCards.map((c) => {
            const Icon = c.icon
            return (
              <motion.div key={c.t} className="why-card" variants={fadeUp} whileHover={{ y: -6 }}>
                <span className="why-icon"><Icon size={22} /></span>
                <h3>{t(c.t)}</h3>
                <p>{t(c.d)}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ---------------- VERSE BAND ---------------- */}
      <section className="verse-band">
        <motion.div variants={stagger} {...inView}>
          <motion.span variants={fadeUp} className="eyebrow">{t('verse.eyebrow')}</motion.span>
          <motion.p variants={fadeUp}>“{pick(settings.verse, locale)}”</motion.p>
          <motion.b variants={fadeUp}>{settings.verseRef}</motion.b>
        </motion.div>
      </section>

      {/* ---------------- ABOUT / QUOTE ---------------- */}
      <section id="about" className="quote-section">
        <motion.div className="quote-mark" initial={{ opacity: 0, scale: 0.4, rotate: -20 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>“</motion.div>
        <motion.p variants={fadeUp} {...inView}>{t('quote.a')}<span>{t('quote.b')}</span>{t('quote.c')}</motion.p>
        <motion.div className="quote-byline" variants={fadeUp} {...inView}>
          <div className="mini-logo"><img src={settings.logoUrl} alt="" /></div>
          <div><b>{t('quote.by')}</b><span>Christian Kingdom Trend Vision</span></div>
        </motion.div>
        <motion.div variants={fadeUp} {...inView} style={{ marginTop: 28 }}>
          <Link href="/about" className="text-link light">{t('footer.story')} <ArrowRight size={17} /></Link>
        </motion.div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="section-wrap" style={{ paddingTop: 90 }}>
        <motion.div className="section-heading" variants={fadeUp} {...inView}>
          <div><span className="eyebrow">{t('steps.eyebrow')}</span><h2>{t('steps.title1')}<span>{t('steps.title2')}</span></h2></div>
        </motion.div>
        <motion.div className="steps" variants={stagger} {...inView}>
          {stepCards.map((s, i) => (
            <motion.div key={s.t} className="step" variants={fadeUp}>
              <span className="step-num">{i + 1}</span>
              <h3>{t(s.t)}</h3>
              <p>{t(s.d)}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---------------- POSTS ---------------- */}
      <section id="posts" className="section-wrap posts-section">
        <motion.div className="section-heading" variants={fadeUp} {...inView}>
          <div><span className="eyebrow">{t('posts.eyebrow')}</span><h2>{t('posts.title1')}<span>{t('posts.title2')}</span></h2></div>
          <Link href="/posts" className="text-link">{t('posts.all')} <ArrowRight size={17} /></Link>
        </motion.div>
        {posts.length === 0 ? (
          <p className="empty-state">{t('post.empty')}</p>
        ) : (
          <motion.div className="post-grid" variants={stagger} {...inView}>
            {posts.slice(0, 3).map((post) => <PostCard key={post.slug} post={post} />)}
          </motion.div>
        )}
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="section-wrap faq-wrap" style={{ paddingTop: 80 }}>
        <motion.div className="section-heading" variants={fadeUp} {...inView}>
          <div><span className="eyebrow">{t('faq.eyebrow')}</span><h2>{t('faq.title1')}<span>{t('faq.title2')}</span></h2></div>
        </motion.div>
        <motion.div className="faq" variants={stagger} {...inView}>
          {faqs.map((f) => <FaqItem key={f.q} q={t(f.q)} a={t(f.a)} />)}
        </motion.div>
      </section>

      {/* ---------------- CTA BAND ---------------- */}
      <section className="cta-band">
        <motion.div variants={stagger} {...inView}>
          <motion.h2 variants={fadeUp}>{t('cta.title')}</motion.h2>
          <motion.p variants={fadeUp}>{t('cta.sub')}</motion.p>
          <motion.div variants={fadeUp} className="cta-actions">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}><Link href="/watch" className="cta-primary">{t('watch.all')} <ArrowRight size={16} /></Link></motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}><Link href="/contact" className="cta-ghost">{t('header.cta')}</Link></motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- NEWSLETTER ---------------- */}
      <section id="contact" className="newsletter-section">
        <motion.div variants={fadeUp} {...inView}>
          <span className="eyebrow">{t('news.eyebrow')}</span>
          <h2>{t('news.line1')}<br /><em>{t('news.line2')}</em></h2>
        </motion.div>
        <motion.form className="newsletter-form" variants={fadeUp} {...inView} onSubmit={onNewsletter}>
          <label htmlFor="email">{t('news.label')}</label>
          <div>
            <input id="email" name="email" type="email" placeholder="you@example.com" required />
            <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{t('news.button')} <ArrowRight size={16} /></motion.button>
          </div>
          <p>{t('news.note')}</p>
        </motion.form>
      </section>
    </>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div className={`faq-item ${open ? 'open' : ''}`} variants={fadeUp}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="faq-plus"><Plus size={18} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease }} style={{ overflow: 'hidden' }}>
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
