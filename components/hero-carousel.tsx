'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { ease } from '@/components/motion-kit'

export type HeroSlide = {
  id: string
  href: string
  title: string
  tag: string
  meta?: string
  image: string
  isNew?: boolean
}

const AUTOPLAY_MS = 5500

const variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 90 : -90, opacity: 0, scale: 0.92, rotate: dir >= 0 ? 4 : -4 }),
  center: { x: 0, opacity: 1, scale: 1, rotate: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? -90 : 90, opacity: 0, scale: 0.92, rotate: dir >= 0 ? -4 : 4 }),
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const { t } = useLanguage()
  const count = slides.length
  const [[index, dir], setPage] = useState<[number, number]>([0, 0])
  const [paused, setPaused] = useState(false)
  const dragged = useRef(false)

  const go = useCallback((target: number, direction: number) => setPage([((target % count) + count) % count, direction]), [count])

  // autoplay (restarts after every change, pauses on hover / touch / focus)
  useEffect(() => {
    if (paused || count < 2) return
    const id = setTimeout(() => go(index + 1, 1), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [index, paused, count, go])

  // 3D tilt that follows the mouse (desktop only)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 140, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 140, damping: 18 })

  const slide = slides[index]
  if (!slide) return null

  return (
    <div
      className="hc"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); mx.set(0); my.set(0) }}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width - 0.5)
        my.set((e.clientY - r.top) / r.height - 0.5)
      }}
      role="region"
      aria-roledescription="carousel"
    >
      <motion.div className="hc-stage" style={{ rotateX, rotateY, transformPerspective: 1100 }}>
        {count > 1 && <div className="hc-ghost hc-ghost-2" />}
        {count > 1 && <div className="hc-ghost hc-ghost-1" />}

        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={slide.id}
            className="hc-slide"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.65, ease }}
            drag={count > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.28}
            onDragStart={() => { dragged.current = true }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -450) go(index + 1, 1)
              else if (info.offset.x > 60 || info.velocity.x > 450) go(index - 1, -1)
              setTimeout(() => { dragged.current = false }, 60)
            }}
          >
            <Link
              href={slide.href}
              className="hc-link"
              draggable={false}
              onClick={(e) => { if (dragged.current) e.preventDefault() }}
              aria-label={slide.title}
            >
              {slide.image ? (
                <motion.img src={slide.image} alt="" draggable={false} className="hc-img" initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 7, ease: 'easeOut' }} />
              ) : (
                <div className="hc-img thumb-fallback" />
              )}
              <div className="hc-shade" />
              <div className="hc-top">
                <span className="hc-tag">{slide.tag}</span>
                {slide.isNew && <span className="hc-new">{t('hero.new')}</span>}
              </div>
              <motion.div className="hc-bottom" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease }}>
                <div>
                  {slide.meta && <small>{slide.meta}</small>}
                  <h2>{slide.title}</h2>
                  <span className="hc-watch">{t('hero.slide.watch')} <ArrowRight size={15} /></span>
                </div>
                <span className="hc-play"><Play size={22} fill="currentColor" /></span>
              </motion.div>
            </Link>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {count > 1 && (
        <div className="hc-controls">
          <button onClick={() => go(index - 1, -1)} aria-label={t('hero.slide.prev')}><ChevronLeft size={18} /></button>
          <div className="hc-dots">
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => go(i, i > index ? 1 : -1)} className={i === index ? 'on' : ''} aria-label={`${t('hero.slide.go')} ${i + 1}`} aria-current={i === index}>
                {i === index && <motion.span key={`${index}-${paused}`} className="hc-progress" initial={{ scaleX: 0 }} animate={{ scaleX: paused ? 0 : 1 }} transition={{ duration: paused ? 0.2 : AUTOPLAY_MS / 1000, ease: 'linear' }} />}
              </button>
            ))}
          </div>
          <span className="hc-count">{String(index + 1).padStart(2, '0')}<i>/{String(count).padStart(2, '0')}</i></span>
          <button onClick={() => go(index + 1, 1)} aria-label={t('hero.slide.next')}><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  )
}
